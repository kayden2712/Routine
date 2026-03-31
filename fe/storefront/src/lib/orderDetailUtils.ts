export interface ShippingInfo {
  fullName: string
  phone: string
  email?: string
  address: string
  district: string
  city: string
}

const SHIPPING_SEPARATOR = ' | '

export function extractApologyLineFromNotes(notes?: string): string | undefined {
  if (!notes) return undefined
  return notes
    .split(SHIPPING_SEPARATOR)
    .find((line) => /xin loi|xin lỗi/i.test(line))
}

export function extractShippingInfoFromNotes(notes?: string): ShippingInfo {
  const notesLines = notes?.split(SHIPPING_SEPARATOR) ?? []
  const addressParts = notesLines
    .find((line) => line.startsWith('Địa chỉ:'))
    ?.replace('Địa chỉ: ', '')
    .trim()
    .split(', ') ?? []

  return {
    fullName: notesLines.find((line) => line.startsWith('Người nhận:'))?.replace('Người nhận: ', '').trim() || '',
    phone: notesLines.find((line) => line.startsWith('SĐT:'))?.replace('SĐT: ', '').trim() || '',
    email: notesLines.find((line) => line.startsWith('Email:'))?.replace('Email: ', '').trim() || '',
    address: addressParts[0] || '',
    district: addressParts[1] || '',
    city: addressParts[2] || '',
  }
}

export function calculateCancellationDeadline(createdDate: Date, deliveredDate?: Date): { deadline: Date; daysLeft: number } {
  const baseDate = deliveredDate ? new Date(deliveredDate) : new Date(createdDate)
  const deadline = new Date(baseDate)
  deadline.setDate(deadline.getDate() + 7)

  const now = new Date()
  const timeLeft = deadline.getTime() - now.getTime()
  const daysLeft = Math.ceil(timeLeft / (1000 * 3600 * 24))

  return { deadline, daysLeft }
}

export async function filesToDataUrls(files: File[]): Promise<string[]> {
  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn.'))
      reader.readAsDataURL(file)
    })

  return Promise.all(files.map((file) => toDataUrl(file)))
}

export function mergeLimitedImages(existing: string[], incoming: string[], limit = 4): string[] {
  return [...existing, ...incoming].slice(0, limit)
}
