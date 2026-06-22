import { Link } from 'react-router-dom';

export const PublicFooter = () => {
  return (
    <footer className="mt-16 border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <img
              src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png"
              alt=""
              className="h-6 w-6"
            />
            <span className="font-bold bg-gradient-primary bg-clip-text text-transparent">
              The Juice App
            </span>
          </div>
          <p className="text-muted-foreground">
            Anonymous dating stories and reviews — by men, for men.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-foreground">Explore</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
            <li><Link to="/how-it-works" className="hover:text-foreground">How It Works</Link></li>
            <li><Link to="/app" className="hover:text-foreground">Sign In</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-foreground">Legal</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link to="/support" className="hover:text-foreground">Support</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="max-w-6xl mx-auto px-4 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Juice. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default PublicFooter;