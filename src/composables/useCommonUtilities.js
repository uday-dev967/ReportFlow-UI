export function useCommonUtilities() {
  const mimeToExtension = {
    'image/jpeg': '.jpeg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/webp': '.webp',
    'image/tiff': '.tiff',
    'image/svg+xml': '.svg',
    'image/x-icon': '.ico',
    'image/vnd.microsoft.icon': '.ico',
    'image/vnd.wap.wbmp': '.wbmp',
    'image/heic': '.heic',
    'image/heic-sequence': '.heics',
    'image/heif': '.heif',
    'image/heif-sequence': '.heifs',
  };

  function capitalizeFirstLetter(string) {
    let lowercasedString = string.toLowerCase();
    return lowercasedString.charAt(0).toUpperCase() + lowercasedString.slice(1);
  }

  async function copyToClipboard(textToCopy) {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  async function uploadImageUsingSignedUrl(signedUrl, uploadObject) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('PUT', signedUrl, true);
      // request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

      request.upload.onprogress = (e) => {
        console.log('onprogress', e);
      };

      request.onload = function () {
        if (request.status >= 200 && request.status < 300) {
          console.log('onload');
          resolve();
        } else {
          reject();
        }
      };

      request.send(uploadObject);
    });
  }

  async function convertObjectUrlsToFiles(urls) {
    const files = await Promise.all(
      urls.map(async (url, index) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const mimeType = blob.type || 'image/png';
          const extension = mimeType.split('/')[1] || 'png';
          const fileName = `thumbnail_${index}.${extension}`;
          const file = new File([blob], fileName, { type: mimeType });
          return { file, mimeType };
        } catch (error) {
          console.error(`Failed to convert URL at index ${index}:`, error);
          return null;
        }
      })
    );
    return files.filter((f) => f !== null); // Filter out failed ones
  }

  function formatDateStringToAgo(dateString) {
    const now = new Date();
    const updatedDate = new Date(dateString);
    const diffMs = now - updatedDate; // Difference in milliseconds
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay >= 1) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffHr >= 1) return `${diffHr} hr${diffHr > 1 ? 's' : ''}. ago`;
    if (diffMin >= 1) return `${diffMin} min${diffMin > 1 ? 's' : ''}. ago`;
    return `${diffSec} sec${diffSec > 1 ? 's' : ''}. ago`;
  }

  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  function getExtensionFromDataURI(dataURI) {
    const mimeType = getDataURIType(dataURI);

    return mimeToExtension[mimeType] || null;
  }

  function getDataURIType(dataURI) {
    const mimeType = dataURI.split(',')[0].split(':')[1].split(';')[0];
    return mimeType;
  }

  function cloneObject(object) {
    return JSON.parse(JSON.stringify(object));
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  function getRandomId() {
    return window.crypto.randomUUID();
  }

  function prepareUniqueSvg(svgString) {
    const uniqueId = getRandomId();
    return svgString
      .replace(/id="([^"]+)"/g, (match, id) => {
        return `id="${id}-${uniqueId}"`;
      })
      .replace(/url\(#([^"]+)\)/g, (match, id) => {
        return `url(#${id}-${uniqueId})`;
      });
  }

  return {
    mimeToExtension,
    capitalizeFirstLetter,
    copyToClipboard,
    uploadImageUsingSignedUrl,
    convertObjectUrlsToFiles,
    formatDateStringToAgo,
    formatDate,
    getExtensionFromDataURI,
    getDataURIType,
    cloneObject,
    debounce,
    getRandomId,
    prepareUniqueSvg,
  };
}
