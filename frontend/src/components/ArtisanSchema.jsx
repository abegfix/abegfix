const ArtisanSchema = ({ artisan }) => {

  const artisanProfile = artisan?.artisanProfile;
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": artisanProfile?.businessName,
    "description": `${artisanProfile?.category} in ${artisanProfile?.location}`,
    "image": artisanProfile?.profilePic,
    "telephone": artisanProfile?.phone,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": artisanProfile?.address,
      "addressRegion": "Lagos",
      "addressCountry": "NG"
    },
    "bio": artisanProfile?.bio,
    "aggregateRating": artisan?.rating
      ? {
          "@type": "AggregateRating",
          "ratingValue": artisanProfile?.rating,
        }
      : undefined
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
};

export default ArtisanSchema;
