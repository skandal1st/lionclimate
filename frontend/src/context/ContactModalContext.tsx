import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import SiteContactModals from '../components/SiteContactModals';

type Ctx = {
  openContact: () => void;
  openConsult: () => void;
  closeModals: () => void;
};

const ContactModalContext = createContext<Ctx | null>(null);

export function useContactModals(): Ctx {
  const v = useContext(ContactModalContext);
  if (!v) {
    throw new Error('useContactModals must be used within ContactModalProvider');
  }
  return v;
}

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);

  const openContact = useCallback(() => {
    setConsultOpen(false);
    setContactOpen(true);
  }, []);

  const openConsult = useCallback(() => {
    setContactOpen(false);
    setConsultOpen(true);
  }, []);

  const closeModals = useCallback(() => {
    setContactOpen(false);
    setConsultOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openContact, openConsult, closeModals }),
    [openContact, openConsult, closeModals]
  );

  useEffect(() => {
    function fromHash() {
      const h = window.location.hash;
      if (h === '#contactModal' || h === '#contact') {
        setConsultOpen(false);
        setContactOpen(true);
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  return (
    <ContactModalContext.Provider value={value}>
      {children}
      <SiteContactModals contactOpen={contactOpen} consultOpen={consultOpen} onClose={closeModals} />
    </ContactModalContext.Provider>
  );
}
