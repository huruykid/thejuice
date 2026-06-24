import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBlogPost } from '@/hooks/useBlogPosts';
import { Calendar, Clock, Eye, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug!);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">Loading blog post...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return <Navigate to="/blog" replace />;
  }

  const sharePost = async () => {
    const url = window.location.href;
    const title = post.title;
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Post URL copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Post URL copied to clipboard",
      });
    }
  };

  const estimatedReadTime = post.read_time_minutes || Math.ceil(post.content.split(' ').length / 200);

  const canonical = `https://sipjuice.app/blog/${post.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt || undefined,
    "image": post.featured_image_url || undefined,
    "datePublished": post.created_at,
    "mainEntityOfPage": canonical,
    "publisher": {
      "@type": "Organization",
      "name": "The Juice App",
      "logo": { "@type": "ImageObject", "url": "https://sipjuice.app/juice-logo.png" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Helmet>
        <title>{post.title.length > 57 ? `${post.title.slice(0, 54)}… | Juice` : `${post.title} | Juice`}</title>
        {post.excerpt && <meta name="description" content={post.excerpt.slice(0, 160)} />}
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={post.title} />
        {post.excerpt && <meta property="og:description" content={post.excerpt.slice(0, 160)} />}
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        {post.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>
      {/* Article */}
      <main>
      <article className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Blog', to: '/blog' },
              { label: post.title },
            ]}
          />
          <Button variant="outline" size="sm" onClick={sharePost}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Story
          </Button>
        </div>
        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4 leading-tight">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(post.created_at), 'MMMM dd, yyyy')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {estimatedReadTime} min read
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {post.views.toLocaleString()} views
            </div>
          </div>
          
          {post.keywords && post.keywords.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {post.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="mb-8">
            <img 
              src={post.featured_image_url} 
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {post.content.split('\n').map((paragraph, index) => {
            if (paragraph.trim() === '') return <br key={index} />;
            
            // Handle headers (##, ###, etc.)
            if (paragraph.startsWith('###')) {
              return (
                <h3 key={index} className="text-xl font-semibold mt-8 mb-4 text-primary">
                  {paragraph.replace('###', '').trim()}
                </h3>
              );
            }
            if (paragraph.startsWith('##')) {
              return (
                <h2 key={index} className="text-2xl font-semibold mt-8 mb-4 text-primary">
                  {paragraph.replace('##', '').trim()}
                </h2>
              );
            }
            if (paragraph.startsWith('#')) {
              return (
                <h2 key={index} className="text-3xl font-bold mt-8 mb-4 text-primary">
                  {paragraph.replace('#', '').trim()}
                </h2>
              );
            }
            
            // Handle bullet points
            if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
              return (
                <li key={index} className="ml-6 mb-2">
                  {paragraph.replace(/^[-•]\s*/, '').trim()}
                </li>
              );
            }
            
            // Handle numbered lists
            if (/^\d+\./.test(paragraph.trim())) {
              return (
                <li key={index} className="ml-6 mb-2 list-decimal">
                  {paragraph.replace(/^\d+\.\s*/, '').trim()}
                </li>
              );
            }
            
            // Regular paragraphs
            return (
              <p key={index} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Published on {format(new Date(post.created_at), 'MMMM dd, yyyy')}
              </p>
            </div>
            
            <Button onClick={sharePost} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share this story
            </Button>
          </div>
        </footer>
      </article>
      </main>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h3 className="text-2xl font-bold mb-4">Read more stories like this one</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Juice is a verified, anonymous space where men share real dating stories. Apply to read them all.
          </p>
          <Link to="/auth">
            <Button size="lg">
              Request Access
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;