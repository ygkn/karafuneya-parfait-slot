export interface Parfait {
  no: number
  name: string
  price: number | null
  /** reservation-only / party size / set-only: excluded from the draw unless opted in */
  special?: boolean
  /** おもしろ系 (savoury novelty) parfait */
  fun?: boolean
  note?: string
  /** indexes into Store.sections */
  sections: number[]
}

export interface Store {
  key: string
  name: string
  pdf: string
  fetchedAt: string
  sections: string[]
  /** true when the store's menu has no flavour headings and 三条本店's are used */
  borrowedSections: boolean
  items: Parfait[]
}

export interface Slip {
  id: number
  serial: number
  storeName: string
  digits: number[]
  parfait: Parfait | null
  showFunNote: boolean
  open: boolean
}
