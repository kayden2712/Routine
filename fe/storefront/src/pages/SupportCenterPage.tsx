import { Clock3, Headset, Mail, MessageSquareText, PhoneCall } from 'lucide-react'

const faqs = [
  {
    question: 'Làm sao để đổi trả sản phẩm?',
    answer: 'Bạn có thể đổi trả trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm chưa qua sử dụng và còn nguyên tem.',
  },
  {
    question: 'Thời gian giao hàng bao lâu?',
    answer: 'Nội thành 2-24 giờ, các tỉnh từ 2-5 ngày làm việc tùy khu vực.',
  },
  {
    question: 'Tôi muốn theo dõi đơn hàng ở đâu?',
    answer: 'Bạn vào mục Tài khoản > Đơn hàng để theo dõi trạng thái vận chuyển theo thời gian thực.',
  },
]

export const SupportCenterPage = () => {
  return (
    <section className="mx-auto max-w-[1100px] space-y-6 py-2">
      <header className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Trung tâm hỗ trợ</p>
        <h1 className="mt-2 font-display text-3xl text-[var(--text-primary)]">Chung toi co the giup gi cho ban?</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Lien he doi ngu ho tro Routine de duoc tu van ve san pham, giao hang, thanh toan va chinh sach doi tra.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-bg)] p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--line-soft)]">
            <PhoneCall size={18} className="text-[var(--text-primary)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Tong dai</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">1900 6868</p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Ho tro don hang va doi tra nhanh.</p>
        </article>

        <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-bg)] p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--line-soft)]">
            <Mail size={18} className="text-[var(--text-primary)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Email ho tro</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">support@routine.vn</p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Phan hoi trong vong 24 gio.</p>
        </article>

        <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-bg)] p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--line-soft)]">
            <Clock3 size={18} className="text-[var(--text-primary)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Gio lam viec</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">08:30 - 22:00 (T2 - CN)</p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">San sang ho tro moi ngay.</p>
        </article>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-bg)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Headset size={18} className="text-[var(--text-primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Cau hoi thuong gap</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
              <div className="mb-1 flex items-start gap-2">
                <MessageSquareText size={15} className="mt-0.5 text-[var(--text-primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{faq.question}</h3>
              </div>
              <p className="pl-6 text-sm text-[var(--text-secondary)]">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
