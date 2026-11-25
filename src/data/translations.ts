import type { Language } from '../types/planner';

export const UI_COPY: Record<
  Language,
  {
    appName: string;
    subtitleDefault: string;
    navChecklist: string;
    navCalendar: string;
    navKlussen: string;
    navBudget: string;
    navDates: string;
    aiButton: string;
    backupButton: string;
    completedLabel: string;
    tasksDoneOf: string;
    allPhases: string;
    filterAll: string;
    filterTodo: string;
    filterDone: string;
    filterUrgent: string;
    urgentLabel: string;
    addTask: string;
    editTask: string;
    deleteTask: string;
    detailsTips: string;
    noteLabel: string;
    notePlaceholder: string;
    dueDateLabel: string;
    durationLabel: string;
    durationPlaceholder: string;
    clearDate: string;
    overdueLabel: string;
    noTasksMatch: string;
    showAllTasks: string;
    save: string;
    cancel: string;
    taskTitleLabel: string;
    taskPhaseLabel: string;
    taskTimingLabel: string;
    taskTimingPlaceholder: string;
    taskDetailsLabel: string;
    taskUrgentToggle: string;
    // Calendar
    calendarTitle: string;
    calendarSubtitle: string;
    calendarMonthView: string;
    calendarBlockView: string;
    calendarListView: string;
    calendarToday: string;
    calendarNoItemsDay: string;
    calendarNoUpcoming: string;
    calendarMilestoneTag: string;
    calendarTaskTag: string;
    calendarKlusTag: string;
    calendarJumpToTab: string;
    calendarExportIcs: string;
    calendarExportIcsHint: string;
    calendarExportIcsEmpty: string;
    calendarBlockAll: string;
    calendarBlockEmpty: string;
    calendarDayProgress: string;
    // Klussen
    klussenTitle: string;
    klussenSubtitle: string;
    klussenDoneOf: string;
    addRoom: string;
    roomNameLabel: string;
    addKlus: string;
    editKlus: string;
    klusNameLabel: string;
    klusRoomLabel: string;
    klusWhoLabel: string;
    klusDiy: string;
    klusPro: string;
    klusContractorName: string;
    klusContractorPhone: string;
    klusDateLabel: string;
    klusStatusLabel: string;
    statusPlanned: string;
    statusInProgress: string;
    statusDone: string;
    klusEstCost: string;
    klusActCost: string;
    calcTitle: string;
    calcSubtitle: string;
    calcLength: string;
    calcWidth: string;
    calcHeight: string;
    calcCoats: string;
    calcOneCoat: string;
    calcTwoCoats: string;
    calcFloorResult: string;
    calcFloorNote: string;
    calcPaintResult: string;
    calcPaintNote: string;
    klussenBudgetSyncNote: string;
    // Budget
    budgetEstimated: string;
    budgetActual: string;
    budgetDiff: string;
    budgetUnder: string;
    budgetOver: string;
    budgetPaidCount: string;
    budgetKlussenSyncedTitle: string;
    budgetKlussenSyncedDesc: string;
    budgetOpenKlussen: string;
    groupAll: string;
    groupKk: string;
    groupMoving: string;
    groupPaid: string;
    groupUnpaid: string;
    addExpense: string;
    editExpense: string;
    paidLabel: string;
    markPaid: string;
    estimatedLabel: string;
    actualLabel: string;
    expenseTitleLabel: string;
    expenseGroupLabel: string;
    kkGroupName: string;
    movingGroupName: string;
    // Dates & Contacts
    keyDatesTitle: string;
    keyDatesSubtitle: string;
    addMilestone: string;
    editMilestone: string;
    milestoneTitleLabel: string;
    milestoneDateLabel: string;
    milestoneNoteLabel: string;
    contactsTitle: string;
    contactsSubtitle: string;
    setDate: string;
    daysRemaining: string;
    todayLabel: string;
    tomorrowLabel: string;
    daysAgo: string;
    calcCoolingOff: string;
    timeNotePlaceholder: string;
    addContact: string;
    editContact: string;
    roleLabel: string;
    nameLabel: string;
    companyLabel: string;
    phoneLabel: string;
    emailLabel: string;
    notesLabel: string;
    callAction: string;
    emailAction: string;
    // Backup & Settings
    backupTitle: string;
    houseAddressLabel: string;
    houseAddressPlaceholder: string;
    languageLabel: string;
    exportJson: string;
    exportDesc: string;
    importJson: string;
    importDesc: string;
    importSuccess: string;
    importError: string;
    resetTitle: string;
    resetButton: string;
    resetConfirmText: string;
    resetConfirmButton: string;
    close: string;
    installAppTitle: string;
    installAppButton: string;
    iosInstallTitle: string;
    iosInstallSteps: string;
    // AI Assistant
    aiTitle: string;
    aiSubtitle: string;
    aiPlaceholder: string;
    aiSend: string;
    aiThinking: string;
    aiSuggestedTasks: string;
    aiAddToChecklist: string;
    aiAdded: string;
    aiStarters: string[];
  }
> = {
  nl: {
    appName: 'Huis & Verhuis Planner',
    subtitleDefault: 'Jouw draaiboek van koopcontract tot sleuteloverdracht',
    navChecklist: 'Checklist',
    navCalendar: 'Kalender',
    navKlussen: 'Klussen',
    navBudget: 'Budget',
    navDates: 'Data',
    aiButton: 'AI Assistent',
    backupButton: 'Backup',
    completedLabel: 'afgerond',
    tasksDoneOf: 'taken voltooid',
    allPhases: 'Alles',
    filterAll: 'Alles',
    filterTodo: 'Te doen',
    filterDone: 'Afgerond',
    filterUrgent: 'Urgent',
    urgentLabel: 'Deadline / Urgent',
    addTask: 'Taak toevoegen',
    editTask: 'Taak bewerken',
    deleteTask: 'Verwijder',
    detailsTips: 'Details & Tips',
    noteLabel: 'Jouw notitie (bijv. naam, meterstand, dossiernr.)',
    notePlaceholder: 'Typ hier gegevens of een herinnering...',
    dueDateLabel: 'Startdatum (optioneel)',
    durationLabel: 'Duur (dagen)',
    durationPlaceholder: '1',
    clearDate: 'Wis datum',
    overdueLabel: 'Verlopen',
    noTasksMatch: 'Geen taken gevonden voor dit filter.',
    showAllTasks: 'Toon alle taken',
    save: 'Opslaan',
    cancel: 'Annuleren',
    taskTitleLabel: 'Titel van de taak',
    taskPhaseLabel: 'Fase',
    taskTimingLabel: 'Moment / Deadline-hint',
    taskTimingPlaceholder: 'bijv. 2 weken voor overdracht',
    taskDetailsLabel: 'Toelichting / Tips (optioneel)',
    taskUrgentToggle: 'Markeer als urgent / strikte deadline',
    calendarTitle: 'Kalender & Planning',
    calendarSubtitle: 'Alle mijlpalen, checklisttaken en klussen op één tijdlijn',
    calendarMonthView: 'Maandoverzicht',
    calendarBlockView: 'Blokkenschema',
    calendarListView: 'Agenda Lijst',
    calendarToday: 'Vandaag',
    calendarNoItemsDay: 'Geen geplande mijlpalen, taken of klussen op deze dag.',
    calendarNoUpcoming: 'Nog geen datums ingepland. Voeg een datum toe bij Data, Checklist of Klussen.',
    calendarMilestoneTag: 'Mijlpaal',
    calendarTaskTag: 'Checklist',
    calendarKlusTag: 'Klus',
    calendarJumpToTab: 'Openen',
    calendarExportIcs: 'Exporteer naar Agenda (.ics)',
    calendarExportIcsHint:
      'Bestand gedownload! Op iPhone Safari kun je direct op het .ics-bestand tikken om alle afspraken in één keer in Apple Agenda te zetten.',
    calendarExportIcsEmpty:
      'Voeg eerst minstens één datum toe bij Data, Checklist of Klussen om te exporteren.',
    calendarBlockAll: 'Alles',
    calendarBlockEmpty:
      'Nog geen items met een datum voor dit filter. Stel een datum in bij Data, Checklist of Klussen.',
    calendarDayProgress: 'Dag {day} van {total}',
    klussenTitle: 'Klussen & Verbouwen',
    klussenSubtitle: 'Plan schilderwerk, vloeren en klussen per ruimte',
    klussenDoneOf: 'klussen klaar',
    addRoom: 'Ruimte toevoegen',
    roomNameLabel: 'Naam van de ruimte',
    addKlus: 'Klus toevoegen',
    editKlus: 'Klus bewerken',
    klusNameLabel: 'Naam van de klus',
    klusRoomLabel: 'Ruimte',
    klusWhoLabel: 'Wie doet het?',
    klusDiy: 'Zelf doen (DIY)',
    klusPro: 'Vakman / Aannemer',
    klusContractorName: 'Naam vakman / bedrijf (optioneel)',
    klusContractorPhone: 'Telefoonnummer (optioneel)',
    klusDateLabel: 'Startdatum',
    klusStatusLabel: 'Status',
    statusPlanned: 'Te plannen',
    statusInProgress: 'Bezig',
    statusDone: 'Klaar',
    klusEstCost: 'Geschatte kosten (€)',
    klusActCost: 'Werkelijke kosten (€)',
    calcTitle: 'Rekenhulp (Verf & Vloer)',
    calcSubtitle: 'Snel m² vloer (+10% snijverlies) en liters muurverf berekenen',
    calcLength: 'Lengte (m)',
    calcWidth: 'Breedte (m)',
    calcHeight: 'Hoogte (m)',
    calcCoats: 'Aantal verflagen',
    calcOneCoat: '1 laag',
    calcTwoCoats: '2 lagen',
    calcFloorResult: 'Vloer incl. 10% snijverlies',
    calcFloorNote: 'Netto vloeroppervlak',
    calcPaintResult: 'Benodigde muurverf',
    calcPaintNote: 'Op basis van ~9 m² per liter per laag',
    klussenBudgetSyncNote: 'Totaal rolt automatisch door naar Budget & Kosten',
    budgetEstimated: 'Totaal Begroot',
    budgetActual: 'Werkelijke Kosten',
    budgetDiff: 'Verschil',
    budgetUnder: 'Binnen budget',
    budgetOver: 'Boven budget',
    budgetPaidCount: 'betaald',
    budgetKlussenSyncedTitle: 'Klussen & Verbouwen (alle ruimtes)',
    budgetKlussenSyncedDesc: 'Automatisch opgeteld vanuit het tabblad Klussen',
    budgetOpenKlussen: 'Bekijk in Klussen',
    groupAll: 'Alle kosten',
    groupKk: 'Kosten Koper & Hypotheek',
    groupMoving: 'Verhuizen & Inrichting',
    groupPaid: 'Betaald',
    groupUnpaid: 'Nog te betalen',
    addExpense: 'Kostenpost toevoegen',
    editExpense: 'Kostenpost bewerken',
    paidLabel: 'Betaald',
    markPaid: 'Markeer betaald',
    estimatedLabel: 'Begroot (€)',
    actualLabel: 'Werkelijk (€)',
    expenseTitleLabel: 'Omschrijving kostenpost',
    expenseGroupLabel: 'Categorie',
    kkGroupName: 'Kosten Koper & Hypotheek',
    movingGroupName: 'Verhuizen, Klussen & Inrichting',
    keyDatesTitle: 'Belangrijke Data & Mijlpalen',
    keyDatesSubtitle: 'Stel je sleuteldata in voor automatische aftelling',
    addMilestone: 'Nieuwe mijlpaal',
    editMilestone: 'Mijlpaal bewerken',
    milestoneTitleLabel: 'Titel van de mijlpaal',
    milestoneDateLabel: 'Datum',
    milestoneNoteLabel: 'Notitie / Tijdstip (optioneel)',
    contactsTitle: 'Contacten & Betrokkenen',
    contactsSubtitle: 'Direct bellen, mailen en dossiernotities bewaren',
    setDate: 'Datum kiezen',
    daysRemaining: 'dagen',
    todayLabel: 'Vandaag',
    tomorrowLabel: 'Morgen',
    daysAgo: 'dagen geleden',
    calcCoolingOff: 'Bereken +3 dagen bedenktijd',
    timeNotePlaceholder: 'Tijdstip / notitie (bijv. 10:00 notaris)',
    addContact: 'Contact toevoegen',
    editContact: 'Contact bewerken',
    roleLabel: 'Rol / Functie',
    nameLabel: 'Naam contactpersoon',
    companyLabel: 'Kantoor / Bedrijf',
    phoneLabel: 'Telefoonnummer',
    emailLabel: 'E-mailadres',
    notesLabel: 'Notities / Dossiernummer',
    callAction: 'Bel',
    emailAction: 'Mail',
    backupTitle: 'Instellingen & Backup',
    houseAddressLabel: 'Adres nieuwe woning (optioneel)',
    houseAddressPlaceholder: 'bijv. Keizersgracht 123, Amsterdam',
    languageLabel: 'Taal / Language',
    exportJson: 'Exporteer JSON backup',
    exportDesc: 'Download al je taken, klussen, data, budget en contacten als bestand.',
    importJson: 'Importeer JSON backup',
    importDesc: 'Herstel je planner vanuit een eerder opgeslagen JSON-bestand.',
    importSuccess: 'Backup succesvol hersteld!',
    importError: 'Ongeldig backup-bestand. Controleer het JSON-formaat.',
    resetTitle: 'Reset naar standaard',
    resetButton: 'Reset alle gegevens',
    resetConfirmText: 'Weet je zeker dat je alles wilt terugzetten naar de standaard checklist en klussen? Dit kan niet ongedaan worden gemaakt.',
    resetConfirmButton: 'Ja, reset alles',
    close: 'Sluiten',
    installAppTitle: 'Zet op iPhone Beginscherm',
    installAppButton: 'App installeren',
    iosInstallTitle: 'Toevoegen aan iPhone Beginscherm',
    iosInstallSteps: 'Tik in Safari onderaan op het Deel-icoon en kies "Zet op beginscherm" voor een app-ervaring.',
    aiTitle: 'Vraag AI Assistent',
    aiSubtitle: 'Stel een vraag over het Nederlandse koopproces, overdracht of klussen',
    aiPlaceholder: 'Bijv. Waar moet ik op letten bij de eindinspectie?',
    aiSend: 'Vraag stellen',
    aiThinking: 'Advies ophalen...',
    aiSuggestedTasks: 'Voorgestelde taken voor je checklist',
    aiAddToChecklist: 'Voeg toe aan checklist',
    aiAdded: 'Toegevoegd',
    aiStarters: [
      'Waar moet ik op letten bij de eindinspectie?',
      'Wat zijn verborgen kosten bij klussen en verhuizen?',
      'Hoe werkt de 3 dagen wettelijke bedenktijd precies?',
      'Welke verzekeringen moeten ingaan bij sleuteloverdracht?',
    ],
  },
  en: {
    appName: 'Huis & Verhuis Planner',
    subtitleDefault: 'Your Dutch home-buying roadmap from contract to keys',
    navChecklist: 'Checklist',
    navCalendar: 'Calendar',
    navKlussen: 'Renovate',
    navBudget: 'Budget',
    navDates: 'Dates',
    aiButton: 'AI Assistant',
    backupButton: 'Backup',
    completedLabel: 'completed',
    tasksDoneOf: 'tasks done',
    allPhases: 'All',
    filterAll: 'All',
    filterTodo: 'To do',
    filterDone: 'Done',
    filterUrgent: 'Urgent',
    urgentLabel: 'Deadline / Urgent',
    addTask: 'Add task',
    editTask: 'Edit task',
    deleteTask: 'Delete',
    detailsTips: 'Details & Tips',
    noteLabel: 'Personal note (e.g. notary name, meter readings)',
    notePlaceholder: 'Add contact details, meter readings or reminders...',
    dueDateLabel: 'Start date (optional)',
    durationLabel: 'Duration (days)',
    durationPlaceholder: '1',
    clearDate: 'Clear date',
    overdueLabel: 'Overdue',
    noTasksMatch: 'No tasks match this filter.',
    showAllTasks: 'Show all tasks',
    save: 'Save',
    cancel: 'Cancel',
    taskTitleLabel: 'Task title',
    taskPhaseLabel: 'Phase',
    taskTimingLabel: 'Target timing / Deadline hint',
    taskTimingPlaceholder: 'e.g. 2 weeks before transfer',
    taskDetailsLabel: 'Details / Tips (optional)',
    taskUrgentToggle: 'Mark as urgent / strict deadline',
    calendarTitle: 'Calendar & Schedule',
    calendarSubtitle: 'All milestones, checklist tasks, and renovation jobs in one view',
    calendarMonthView: 'Month grid',
    calendarBlockView: 'Timeline blocks',
    calendarListView: 'Agenda list',
    calendarToday: 'Today',
    calendarNoItemsDay: 'No milestones, tasks, or jobs scheduled for this day.',
    calendarNoUpcoming: 'No dates scheduled yet. Add dates in Dates, Checklist, or Renovate.',
    calendarMilestoneTag: 'Milestone',
    calendarTaskTag: 'Checklist',
    calendarKlusTag: 'Renovation',
    calendarJumpToTab: 'Open',
    calendarExportIcs: 'Export to Calendar (.ics)',
    calendarExportIcsHint:
      'File downloaded! In iPhone Safari, tap the .ics file to add all scheduled events straight into Apple Calendar in one tap.',
    calendarExportIcsEmpty:
      'Add at least one date in Dates, Checklist, or Renovate before exporting.',
    calendarBlockAll: 'All',
    calendarBlockEmpty:
      'No dated items match this filter yet. Add dates in Dates, Checklist, or Renovate.',
    calendarDayProgress: 'Day {day} of {total}',
    klussenTitle: 'Klussen & Renovation',
    klussenSubtitle: 'Plan painting, flooring, and repairs room by room',
    klussenDoneOf: 'jobs done',
    addRoom: 'Add room',
    roomNameLabel: 'Room name',
    addKlus: 'Add job',
    editKlus: 'Edit job',
    klusNameLabel: 'Job name',
    klusRoomLabel: 'Room',
    klusWhoLabel: 'Who is doing it?',
    klusDiy: 'DIY (Self)',
    klusPro: 'Contractor / Pro',
    klusContractorName: 'Contractor name / company (optional)',
    klusContractorPhone: 'Phone number (optional)',
    klusDateLabel: 'Start date',
    klusStatusLabel: 'Status',
    statusPlanned: 'To plan',
    statusInProgress: 'In progress',
    statusDone: 'Done',
    klusEstCost: 'Estimated cost (€)',
    klusActCost: 'Actual cost (€)',
    calcTitle: 'Quick Calculator (Paint & Flooring)',
    calcSubtitle: 'Estimate floor m² (+10% cutting waste) and wall paint liters',
    calcLength: 'Length (m)',
    calcWidth: 'Width (m)',
    calcHeight: 'Wall height (m)',
    calcCoats: 'Paint coats',
    calcOneCoat: '1 coat',
    calcTwoCoats: '2 coats',
    calcFloorResult: 'Floor incl. 10% waste',
    calcFloorNote: 'Net floor area',
    calcPaintResult: 'Estimated wall paint',
    calcPaintNote: 'Based on ~9 m² per liter per coat',
    klussenBudgetSyncNote: 'Totals sync automatically to Budget & Costs',
    budgetEstimated: 'Total Estimated',
    budgetActual: 'Actual Spent',
    budgetDiff: 'Difference',
    budgetUnder: 'Under budget',
    budgetOver: 'Over budget',
    budgetPaidCount: 'paid',
    budgetKlussenSyncedTitle: 'Renovation & DIY (all rooms)',
    budgetKlussenSyncedDesc: 'Automatically rolled up from the Renovate tab',
    budgetOpenKlussen: 'Open Renovate',
    groupAll: 'All items',
    groupKk: 'Kosten Koper & Mortgage',
    groupMoving: 'Moving & Furnishing',
    groupPaid: 'Paid',
    groupUnpaid: 'Unpaid',
    addExpense: 'Add expense',
    editExpense: 'Edit expense',
    paidLabel: 'Paid',
    markPaid: 'Mark paid',
    estimatedLabel: 'Estimated (€)',
    actualLabel: 'Actual (€)',
    expenseTitleLabel: 'Expense description',
    expenseGroupLabel: 'Category',
    kkGroupName: 'Kosten Koper & Mortgage',
    movingGroupName: 'Moving, Renovation & Furnishing',
    keyDatesTitle: 'Key Dates & Milestones',
    keyDatesSubtitle: 'Set milestone dates for automatic countdowns',
    addMilestone: 'New milestone',
    editMilestone: 'Edit milestone',
    milestoneTitleLabel: 'Milestone title',
    milestoneDateLabel: 'Date',
    milestoneNoteLabel: 'Note / Time (optional)',
    contactsTitle: 'Key Contacts',
    contactsSubtitle: 'Quick call, email and save file references',
    setDate: 'Pick date',
    daysRemaining: 'days',
    todayLabel: 'Today',
    tomorrowLabel: 'Tomorrow',
    daysAgo: 'days ago',
    calcCoolingOff: 'Set +3 days reflection end',
    timeNotePlaceholder: 'Time / note (e.g. 10:00 at notary)',
    addContact: 'Add contact',
    editContact: 'Edit contact',
    roleLabel: 'Role',
    nameLabel: 'Contact name',
    companyLabel: 'Office / Company',
    phoneLabel: 'Phone number',
    emailLabel: 'Email address',
    notesLabel: 'Notes / File reference',
    callAction: 'Call',
    emailAction: 'Email',
    backupTitle: 'Settings & Backup',
    houseAddressLabel: 'New home address (optional)',
    houseAddressPlaceholder: 'e.g. Keizersgracht 123, Amsterdam',
    languageLabel: 'Language / Taal',
    exportJson: 'Export JSON backup',
    exportDesc: 'Download all tasks, renovations, dates, budget and contacts as a file.',
    importJson: 'Import JSON backup',
    importDesc: 'Restore your planner from a previously exported JSON file.',
    importSuccess: 'Backup restored successfully!',
    importError: 'Invalid backup file. Please check the JSON format.',
    resetTitle: 'Reset to default',
    resetButton: 'Reset all data',
    resetConfirmText: 'Are you sure you want to reset everything back to the default checklist and renovation rooms? This cannot be undone.',
    resetConfirmButton: 'Yes, reset all',
    close: 'Close',
    installAppTitle: 'Add to iPhone Home Screen',
    installAppButton: 'Install App',
    iosInstallTitle: 'Install on iPhone / iPad',
    iosInstallSteps: 'In Safari, tap the Share button at the bottom and select "Add to Home Screen" for a native app experience.',
    aiTitle: 'Ask AI Assistant',
    aiSubtitle: 'Ask anything about Dutch home buying, notary transfer or renovating',
    aiPlaceholder: 'E.g. What should I check during the final inspection?',
    aiSend: 'Ask',
    aiThinking: 'Getting advice...',
    aiSuggestedTasks: 'Suggested tasks for your checklist',
    aiAddToChecklist: 'Add to checklist',
    aiAdded: 'Added',
    aiStarters: [
      'What should I check during the final inspection (eindinspectie)?',
      'What are common hidden costs when renovating and moving?',
      'How does the 3-day Dutch reflection period (bedenktijd) work?',
      'Which insurances must start on key handover day?',
    ],
  },
};
