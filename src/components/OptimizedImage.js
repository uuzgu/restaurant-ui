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

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      {...props}
    />
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