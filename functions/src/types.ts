export interface ThaaliSubmissionEmailData {
  itemSelections: SingleItemSelection[],
  hijriMonthName: string,
  hijriYear: string,
  userEmails: string
  familyDisplayName: string
}

interface SingleItemSelection {
  itemName: string,
  itemDate: string,
  thaaliChoice: string
}


