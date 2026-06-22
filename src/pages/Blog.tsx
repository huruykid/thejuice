import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, Eye, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

const Blog = () => {
  const { data: posts, isLoading } = useBlogPosts(true);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">Loading blog posts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <Helmet>
        <title>Juice Blog — Men's Dating Stories, Advice & Reviews</title>
        <meta name="description" content="Anonymous dating stories, honest reviews, and real advice from verified men. No fluff, no filters." />
        <link rel="canonical" href="https://thejuice.lovable.app/blog" />
        <meta property="og:title" content="Juice Blog — Men's Dating Stories, Advice & Reviews" />
        <meta property="og:description" content="Anonymous dating stories, honest reviews, and real advice from verified men." />
        <meta property="og:url" content="https://thejuice.lovable.app/blog" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <main>
        <div className="mb-6">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Blog' }]} />
        </div>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Juice — Dating Stories & Advice for Men
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Real stories. Honest ratings. Advice from verified men.
          </p>
          
          {user && (
            <Link to="/viral-marketing-hub">
              <Button>
                Create New Post
              </Button>
            </Link>
          )}
        </div>

        {/* Featured Post */}
        {posts && posts.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <Badge className="w-fit mb-2">Featured</Badge>
              <CardTitle className="text-2xl">
                <Link 
                  to={`/blog/${posts[0].slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {posts[0].title}
                </Link>
              </CardTitle>
              <CardDescription className="text-base">
                {posts[0].excerpt}
              </CardDescription>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(posts[0].created_at), 'MMM dd, yyyy')}
                </div>
                {posts[0].read_time_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {posts[0].read_time_minutes} min read
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {posts[0].views} views
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link to={`/blog/${posts[0].slug}`}>
                <Button className="group">
                  Read the Full Story
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Blog Posts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts?.slice(1).map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="hover:text-primary transition-colors line-clamp-2"
                  >
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(post.created_at), 'MMM dd')}
                  </div>
                  {post.read_time_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.read_time_minutes}m
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views}
                  </div>
                </div>
                
                {post.keywords && post.keywords.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-4">
                    {post.keywords.slice(0, 3).map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <Link to={`/blog/${post.slug}`}>
                  <Button variant="outline" size="sm" className="group">
                    Read Story
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!posts || posts.length === 0) && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Nothing here yet.</h3>
            <p className="text-muted-foreground mb-4">
              The first story is the most important one.
            </p>
            {user && (
              <Link to="/viral-marketing-hub">
                <Button>Create First Post</Button>
              </Link>
            )}
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default Blog;