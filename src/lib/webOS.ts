import "webostvjs/webOSTV";

export const lunaCall = (uri: string, parameters: any = {}): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.webOS && window.webOS.service) {
      const s = uri.indexOf("/", 7);
      // @ts-ignore
      window.webOS.service.request(uri.substr(0, s), {
        method: uri.substr(s + 1),
        parameters,
        onSuccess: resolve,
        onFailure: (res: any) => {
          reject(new Error(JSON.stringify(res)));
        },
      });
    } else {
      reject(new Error('webOS service not available'));
    }
  });
};

export const checkConnectivity = () => {
  // First, check basic navigator status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  } else {
    return true
  }
};

export const launchTuner = async () => {
  try {
    // Try launching Live TV app
    await lunaCall('luna://com.webos.service.applicationManager/launch', {
      id: 'com.webos.app.livetv'
    });
  } catch (e) {
    console.error('Failed to launch tuner:', e);
  }
};

export const closeApp = () => {
  if (typeof window !== 'undefined') {
    window.close();
  }
};
