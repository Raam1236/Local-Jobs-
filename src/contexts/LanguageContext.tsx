import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi' | 'kn';

const translations = {
  en: {
    welcome: 'Welcome',
    findJobs: 'Find Local Jobs',
    nearbyJobs: 'Nearby Jobs',
    postJob: 'Post a Job',
    profile: 'Profile',
    myJobs: 'My Jobs',
    applications: 'Applications',
    skills: 'Skills',
    location: 'Location',
    phone: 'Phone',
    role: 'Role',
    worker: 'Worker',
    employer: 'Employer',
    apply: 'Apply Now',
    applied: 'Applied',
    title: 'Title',
    description: 'Description',
    payment: 'Payment',
    time: 'Time',
    save: 'Save',
    logout: 'Logout',
    category: 'Category',
    allCategories: 'All Categories',
    delivery: 'Delivery',
    helper: 'Helper',
    mechanic: 'Mechanic',
    cleaner: 'Cleaner',
    repair: 'Repair',
    construction: 'Construction',
    others: 'Others',
    searchPlaceholder: 'Search for jobs, skills...',
    noJobsFound: 'No jobs found nearby.',
    errorLocation: 'Please enable location to see nearby jobs.'
  },
  hi: {
    welcome: 'स्वागत है',
    findJobs: 'स्थानीय नौकरियां खोजें',
    nearbyJobs: 'आस-पास की नौकरियां',
    postJob: 'नौकरी पोस्ट करें',
    profile: 'प्रोफ़ाइल',
    myJobs: 'मेरी नौकरियां',
    applications: 'आवेदन',
    skills: 'कौशल',
    location: 'स्थान',
    phone: 'फ़ोन',
    role: 'भूमिका',
    worker: 'कामगार',
    employer: 'नियोक्ता',
    apply: 'अभी आवेदन करें',
    applied: 'आवेदन किया',
    title: 'शीर्षक',
    description: 'विवरण',
    payment: 'भुगतान',
    time: 'समय',
    save: 'सहेजें',
    logout: 'लॉगआउट',
    category: 'श्रेणी',
    allCategories: 'सभी श्रेणियां',
    delivery: 'डिलीवरी',
    helper: 'हेल्पर',
    mechanic: 'मैकेनिक',
    cleaner: 'क्लीनर',
    repair: 'मरम्मत',
    construction: 'निर्माण',
    others: 'अन्य',
    searchPlaceholder: 'नौकरियां, कौशल खोजें...',
    noJobsFound: 'आस-पास कोई नौकरी नहीं मिली।',
    errorLocation: 'आस-पास की नौकरियां देखने के लिए स्थान सक्षम करें।'
  },
  kn: {
    welcome: 'ಸ್ವಾಗತ',
    findJobs: 'ಸ್ಥಳೀಯ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ',
    nearbyJobs: 'ಹತ್ತಿರದ ಉದ್ಯೋಗಗಳು',
    postJob: 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ',
    profile: 'ಪ್ರೊಫೈಲ್',
    myJobs: 'ನನ್ನ ಉದ್ಯೋಗಗಳು',
    applications: 'ಅರ್ಜಿಗಳು',
    skills: 'ಕೌಶಲ್ಯಗಳು',
    location: 'ಸ್ಥಳ',
    phone: 'ಫೋನ್',
    role: 'ಪಾತ್ರ',
    worker: 'ಕೆಲಸಗಾರ',
    employer: 'ಉದ್ಯೋಗದಾತ',
    apply: 'ಈಗಲೇ ಅರ್ಜಿಹಾಕಿ',
    applied: 'ಅರ್ಜಿ ಹಾಕಲಾಗಿದೆ',
    title: 'ಶೀರ್ಷಿಕೆ',
    description: 'ವಿವರಣೆ',
    payment: 'ಪಾವತಿ',
    time: 'ಸಮಯ',
    save: 'ಉಳಿಸಿ',
    logout: 'ನಿರ್ಗಮನ',
    category: 'ವರ್ಗ',
    allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
    delivery: 'ಡೆಲಿವರಿ',
    helper: 'ಸಹಾಯಕ',
    mechanic: 'ಮೆಕ್ಯಾನಿಕ್',
    cleaner: 'ಕ್ಲೀನರ್',
    repair: 'ದುರಸ್ತಿ',
    construction: 'ನಿರ್ಮಾಣ',
    others: 'ಇತರೆ',
    searchPlaceholder: 'ಉದ್ಯೋಗಗಳು, ಕೌಶಲ್ಯ ಹುಡುಕಿ...',
    noJobsFound: 'ಹತ್ತಿರದಲ್ಲಿ ಯಾವುದೇ ಉದ್ಯೋಗಗಳು ಕಂಡುಬಂದಿಲ್ಲ.',
    errorLocation: 'ಹತ್ತಿರದ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಲು ಸ್ಥಳವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ.'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
