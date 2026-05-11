type PointPhotoProps = {
  name: string;
  originalPictureUrl: string;
  optimizedPictureUrl: string;
};

export function PointPhoto({ name, originalPictureUrl, optimizedPictureUrl }: PointPhotoProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
      <img
        src={optimizedPictureUrl}
        alt={name}
        className="h-44 w-full object-cover"
        loading="lazy"
        width={640}
        height={352}
        onError={(event) => {
          const imageElement = event.currentTarget;
          if (originalPictureUrl && imageElement.src !== originalPictureUrl) {
            imageElement.src = originalPictureUrl;
          }
        }}
      />
    </div>
  );
}
