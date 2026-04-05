const sv = {
  common: {
    loading: 'Laddar...',
    save: 'Spara',
    cancel: 'Avbryt',
    back: 'Tillbaka',
  },
  auth: {
    email: 'Email',
    password: 'Lösenord',
    login: 'Logga in',
    signup: 'Skapa konto',
    checkEmail: 'Kolla din email för bekräftelse!',
    tagline: 'Hitta träningsmatcher & cuper',
  },
  home: {
    greeting: 'God dag,',
    noTeam: 'Skapa ett lag för att komma igång',
    createTeam: 'Skapa lag',
    quickActions: 'Vad vill du göra?',
    postMatch: 'Lägg upp match',
    postMatchSub: 'Sök motståndare',
    findMatch: 'Hitta match',
    findMatchSub: 'Se alla annonser',
    findCup: 'Hitta cup',
    findCupSub: 'Cuper & turneringar',
    bookReferee: 'Boka domare',
    bookRefereeSub: 'Sök tillgängliga',
    notifications: 'Notiser',
    showAll: 'Visa alla',
    noNotifications: 'Inga nya notiser',
    upcomingMatches: 'Kommande matcher',
    noMatches: 'Inga kommande matcher',
  },
  nav: {
    home: 'Hem',
    search: 'Sök',
    post: 'Lägg upp',
    notifications: 'Notiser',
    profile: 'Profil',
  },
}

export function useLanguage() {
  return sv
}