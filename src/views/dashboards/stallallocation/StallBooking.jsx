// popupUtils.js
import Swal from 'sweetalert2';

// Function for confirmation popup
export const showConfirmationPopup = async (title, text = '', confirmText = 'Yes', cancelText = 'Cancel', icon = 'question') => {
  return await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
};

// Function for success popup
export const showSuccessPopup = (title, text = '', confirmButton = 'OK') => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: confirmButton,
  });
};

// Function for error popup
export const showErrorPopup = (title, text = '', confirmButton = 'OK') => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: confirmButton,
  });
};

// Function for custom modal with HTML content
export const showCustomModal = (title, htmlContent, width = '60%', cancelButton = true) => {
  return Swal.fire({
    title,
    html: htmlContent,
    width,
    showCancelButton: cancelButton,
  });
};

// Function for image popup
export const showImagePopup = (imageUrl, width = '50%') => {
  return Swal.fire({
    imageUrl,
    showCloseButton: true,
    showConfirmButton: false,
    width,
  });
};
