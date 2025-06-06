import React from 'react';
import PropTypes from 'prop-types';

const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  sizes = '100vw',
  quality = 75,
  ...props
}) => {
  // Check if the image is a local asset (imported) or a remote URL
  const isLocalAsset = typeof src === 'string' && !src.startsWith('http') && !src.startsWith('data:');
  
  // For local assets, ensure the path is correct
  const imageSrc = isLocalAsset ? src.replace(/^\.\.\/assets\//, './assets/') : src;
  
  // Only generate WebP and srcset for local assets
  const getWebPSrc = (imageSrc) => {
    if (isLocalAsset) {
      return imageSrc.replace(/\.(jpg|jpeg|png)$/, '.webp');
    }
    return imageSrc;
  };

  const generateSrcSet = (imageSrc) => {
    if (!isLocalAsset) {
      return undefined;
    }

    const widths = [320, 640, 960, 1280, 1920];
    return widths
      .map(width => `${imageSrc}?w=${width}&q=${quality} ${width}w`)
      .join(', ');
  };

  const webpSrc = getWebPSrc(imageSrc);
  const srcSet = generateSrcSet(imageSrc);
  const webpSrcSet = generateSrcSet(webpSrc);

  return (
    <picture>
      {webpSrcSet && (
        <source
          type="image/webp"
          srcSet={webpSrcSet}
          sizes={sizes}
        />
      )}
      <img
        src={imageSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={className}
        {...props}
      />
    </picture>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  loading: PropTypes.oneOf(['lazy', 'eager']),
  sizes: PropTypes.string,
  quality: PropTypes.number,
};

export default OptimizedImage; 