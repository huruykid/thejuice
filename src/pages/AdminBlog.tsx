import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useBlogPosts, useUpdateBlogPost, useDeleteBlogPost, BlogPost } from "@/hooks/useBlogPosts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, Trash2, Pencil, Globe, FileEdit } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin blog console. AI-generated posts land here as drafts (enforced by the
 * force_system_blog_drafts trigger); an admin reviews, edits, publishes, or deletes them.
 * All operations are gated by the admin-only RLS policies on blog_posts.
 */
const AdminBlog = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "published" | "drafts">("all");
  const publishedArg = filter === "all" ? undefined : filter === "published";
  const { data: posts, isLoading } = useBlogPosts(publishedArg);
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const [editing, setEditing] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (!authLoading && !roleLoading && user && !isAdmin) navigate("/app");
  }, [authLoading, roleLoading, isAdmin, user, navigate]);

  if (authLoading || isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  if (!user || !isAdmin) return null;

  const togglePublish = (p: BlogPost) => {
    updatePost.mutate(
      { id: p.id, updates: { published: !p.published } },
      {
        onSuccess: () => toast.success(p.published ? "Unpublished" : "Published"),
        onError: (e: any) => toast.error(e?.message || "Update failed"),
      }
    );
  };

  const remove = (p: BlogPost) => {
    if (!window.confirm(`Permanently delete "${p.title}"? This cannot be undone.`)) return;
    deletePost.mutate(p.id, {
      onSuccess: () => toast.success("Post deleted"),
      onError: (e: any) => toast.error(e?.message || "Delete failed"),
    });
  };

  return (
    <div className="bg-gradient-soft p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Blog</h1>
            <p className="text-sm text-muted-foreground">
              Review AI-drafted posts before they go public. Edit, publish, or delete.
            </p>
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="drafts">Drafts</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {(posts ?? []).map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base">{p.title || "(untitled)"}</CardTitle>
                  {p.published ? (
                    <Badge variant="outline" className="text-success border-success">
                      <Globe className="w-3 h-3 mr-1" />
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <FileEdit className="w-3 h-3 mr-1" />
                      Draft
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleString()} · <Eye className="inline w-3 h-3" /> {p.views} views · /{p.slug}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                  <Button size="sm" onClick={() => togglePublish(p)} disabled={updatePost.isPending}>
                    <Globe className="w-4 h-4 mr-1" />
                    {p.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => remove(p)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(posts ?? []).length === 0 && (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground text-sm">
                No posts in this view.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {editing && <EditDialog post={editing} onClose={() => setEditing(null)} updatePost={updatePost} />}
    </div>
  );
};

const EditDialog = ({
  post,
  onClose,
  updatePost,
}: {
  post: BlogPost;
  onClose: () => void;
  updatePost: ReturnType<typeof useUpdateBlogPost>;
}) => {
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [content, setContent] = useState(post.content);
  const [published, setPublished] = useState(post.published);

  const save = () => {
    updatePost.mutate(
      { id: post.id, updates: { title, excerpt, content, published } },
      {
        onSuccess: () => {
          toast.success("Saved");
          onClose();
        },
        onError: (e: any) => toast.error(e?.message || "Save failed"),
      }
    );
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="b-title">Title</Label>
            <Input id="b-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-excerpt">Excerpt</Label>
            <Textarea id="b-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-content">Content</Label>
            <Textarea
              id="b-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="b-pub" checked={published} onCheckedChange={setPublished} />
            <Label htmlFor="b-pub">Published</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={updatePost.isPending}>
            {updatePost.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBlog;
