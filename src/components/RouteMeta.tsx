import { Helmet } from "react-helmet-async";

const ORIGIN = "https://sipjuice.app";

interface RouteMetaProps {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}

/** Per-route title/description/canonical/og tags for routes without their own Helmet. */
export const RouteMeta = ({ path, title, description, noindex }: RouteMetaProps) => {
  const url = `${ORIGIN}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {noindex && <meta name="robots" content="noindex, follow" />}
    </Helmet>
  );
};

export default RouteMeta;
