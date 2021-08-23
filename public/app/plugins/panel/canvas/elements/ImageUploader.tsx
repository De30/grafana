import React, { useState } from 'react';

const ImageUploader = () => {
  const [file, setFile] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const handleImageChange = (e) => {
    e.preventDefault();

    let reader = new FileReader();
    let file = e.target.files[0];

    reader.onloadend = () => {
      setFile(file);
      setImagePreviewUrl(reader.result);
    };

    reader.readAsDataURL(file);
  };

  let $imagePreview = null;
  if (imagePreviewUrl) {
    $imagePreview = <img src={imagePreviewUrl} />;
  } else {
    $imagePreview = <div className="previewText">Please select an Image for Preview</div>;
  }

  return (
    <div className="previewComponent">
      <form>
        <input className="fileInput" type="file" onChange={handleImageChange} />
      </form>
      <div className="imgPreview">{$imagePreview}</div>
    </div>
  );
};

export default ImageUploader;
