import { useEffect, useState } from "react";
import toastError from "../../errors/toastError";

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      toastError(error);
      return initialValue;
    }
  });

  // outras telas (ou abas) que usam a mesma chave recebem a mudança na hora
  useEffect(() => {
    const sync = event => {
      if (event.key && event.key !== key) return;
      try {
        const item = localStorage.getItem(key);
        if (item !== null) setStoredValue(JSON.parse(item));
      } catch (error) {
        // valor inválido: mantém o atual
      }
    };
    const onLocal = () => sync({ key });
    window.addEventListener("storage", sync);
    window.addEventListener(`local-storage:${key}`, onLocal);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(`local-storage:${key}`, onLocal);
    };
  }, [key]);

  const setValue = value => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      localStorage.setItem(key, JSON.stringify(valueToStore));
      window.dispatchEvent(new Event(`local-storage:${key}`));
    } catch (error) {
      toastError(error);
    }
  };

  return [storedValue, setValue];
}
