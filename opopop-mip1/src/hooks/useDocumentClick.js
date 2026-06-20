import React, { useEffect } from "react";

const useDocumentClick = (callback) => {
  useEffect(() => {
    document.addEventListener("click", callback);
    return () => document.removeEventListener("click", callback);
  }, [callback]);
};

export default useDocumentClick;
