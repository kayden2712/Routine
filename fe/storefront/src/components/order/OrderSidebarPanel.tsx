import { Button } from '@/components/ui/button'
import { OrderReviewSection } from '@/components/order/OrderReviewSection'
import { calculateCancellationDeadline } from '@/lib/orderDetailUtils'
import { cancelReasonOptions } from '@/lib/orderStatus'
import { formatVnd } from '@/lib/utils'
import type { OrderDetail } from '@/types/orderDetail'

interface OrderSidebarPanelProps {
  order: OrderDetail
  cardClass: string
  showCancelForm: boolean
  cancelReason: (typeof cancelReasonOptions)[number]
  isSubmittingCancel: boolean
  isConfirmingComplete: boolean
  isRevokingCancel: boolean
  isSubmittingRefund: boolean
  ratingByProduct: Record<string, number>
  commentByProduct: Record<string, string>
  reviewImagesByProduct: Record<string, string[]>
  reviewSubmittingForProduct: string | null
  submittedReviewByProduct: Record<string, boolean>
  onToggleCancelForm: () => void
  onCancelReasonChange: (reason: (typeof cancelReasonOptions)[number]) => void
  onCancelRequest: () => void
  onConfirmCompleted: () => void
  onRefundRequest: () => void
  onRevokeCancelRequest: () => void
  onRatingChange: (productId: string, rating: number) => void
  onCommentChange: (productId: string, comment: string) => void
  onSelectImages: (productId: string, files: FileList | null) => void
  onRemoveImage: (productId: string, imageIndex: number) => void
  onSubmitReview: (productId: string) => void
}

export function OrderSidebarPanel({
  order,
  cardClass,
  showCancelForm,
  cancelReason,
  isSubmittingCancel,
  isConfirmingComplete,
  isRevokingCancel,
  isSubmittingRefund,
  ratingByProduct,
  commentByProduct,
  reviewImagesByProduct,
  reviewSubmittingForProduct,
  submittedReviewByProduct,
  onToggleCancelForm,
  onCancelReasonChange,
  onCancelRequest,
  onConfirmCompleted,
  onRefundRequest,
  onRevokeCancelRequest,
  onRatingChange,
  onCommentChange,
  onSelectImages,
  onRemoveImage,
  onSubmitReview,
}: OrderSidebarPanelProps) {
  return (
    <div className="space-y-3.5">
      <div className={`${cardClass} p-4 sm:p-5`}>
        <p className="mb-2.5 text-base font-semibold text-[var(--text-primary)]">Thông tin giao hàng</p>
        {order.shippingInfo ? (
          <div className="space-y-1.5 text-sm text-[var(--text-secondary)]">
            <p>
              <span className="font-medium text-[var(--text-primary)]">{order.shippingInfo.fullName}</span>
            </p>
            <p>{order.shippingInfo.phone}</p>
            <p>{order.shippingInfo.email}</p>
            <p className="text-xs leading-relaxed">
              {order.shippingInfo.address}, {order.shippingInfo.district}, {order.shippingInfo.city}
            </p>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-secondary)]">Chưa có thông tin</p>
        )}
      </div>

      <div className={`${cardClass} p-4 sm:p-5`}>
        <p className="mb-1.5 text-base font-semibold text-[var(--text-primary)]">Phương thức thanh toán</p>
        <p className="text-sm text-[var(--text-secondary)]">
          {order.paymentMethod === 'bank' ? 'Chuyển khoản' : 'Thanh toán khi nhận hàng (COD)'}
        </p>
      </div>

      <div className={`${cardClass} p-4 sm:p-5`}>
        <p className="mb-2 text-base font-semibold text-[var(--text-primary)]">Tổng thanh toán</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Tạm tính</span>
            <span className="text-[var(--text-primary)]">{formatVnd(order.subtotal)}</span>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Giảm giá</span>
              <span className="text-red-600">-{formatVnd(order.discount)}</span>
            </div>
          ) : null}
          <div className="border-t border-[var(--line)] pt-2">
            <div className="flex justify-between font-semibold">
              <span className="text-[var(--text-primary)]">Tổng thanh toán</span>
              <span className="text-xl text-[var(--text-primary)]">{formatVnd(order.total)}</span>
            </div>
          </div>
        </div>

        {order.status === 'processing' || order.status === 'preparing' ? (
          <Button
            onClick={onToggleCancelForm}
            variant="outline"
            className="mt-4 w-full border-red-300 font-semibold text-red-600 hover:bg-red-50"
            disabled={isSubmittingCancel || isConfirmingComplete || isSubmittingRefund}
          >
            {showCancelForm ? 'Đóng form hủy' : 'Yêu cầu hủy đơn'}
          </Button>
        ) : null}

        {order.status === 'shipping' ? (
          <Button
            onClick={onConfirmCompleted}
            className="mt-3 w-full bg-[#1f6feb] text-white hover:bg-[#1a5ec9]"
            disabled={isConfirmingComplete || isSubmittingCancel || isRevokingCancel || isSubmittingRefund}
          >
            {isConfirmingComplete ? 'Đang xác nhận...' : 'Xác nhận đơn hàng'}
          </Button>
        ) : null}

        {order.status === 'shipping' ? (
          <Button
            onClick={onRefundRequest}
            variant="outline"
            className="mt-3 w-full border-orange-300 font-semibold text-orange-700 hover:bg-orange-50"
            disabled={isSubmittingRefund || isConfirmingComplete || isSubmittingCancel || isRevokingCancel}
          >
            {isSubmittingRefund ? 'Đang gửi yêu cầu hoàn tiền...' : 'Yêu cầu hoàn tiền'}
          </Button>
        ) : null}

        {order.status === 'refund_requested' ? (
          <Button
            variant="outline"
            className="mt-3 w-full border-orange-300 text-orange-700"
            disabled
          >
            Đang xử lý hoàn tiền
          </Button>
        ) : null}

        {order.status === 'refunded' ? (
          <Button
            variant="outline"
            className="mt-3 w-full border-emerald-300 text-emerald-700"
            disabled
          >
            Đã hoàn tiền
          </Button>
        ) : null}

        {order.status === 'cancel_requested' ? (
          <Button
            onClick={onRevokeCancelRequest}
            variant="outline"
            className="mt-3 w-full border-amber-300 font-semibold text-amber-700 hover:bg-amber-50"
            disabled={isRevokingCancel || isSubmittingCancel || isConfirmingComplete || isSubmittingRefund}
          >
            {isRevokingCancel ? 'Đang xử lý...' : 'Hủy yêu cầu hủy đơn'}
          </Button>
        ) : null}
      </div>

      {showCancelForm && (order.status === 'processing' || order.status === 'preparing') ? (
        <div className={`${cardClass} p-4 sm:p-5`}>
          {(() => {
            const { deadline, daysLeft } = calculateCancellationDeadline(order.createdAt, order.deliveredAt)
            const isUrgent = daysLeft <= 2
            return (
              <>
                <div className={`mb-4 rounded-xl border-l-4 p-3 ${
                  isUrgent
                    ? 'border-l-red-500 bg-red-50 text-red-700'
                    : 'border-l-amber-500 bg-amber-50 text-amber-700'
                }`}>
                  <p className="text-xs font-semibold">Ngày hẹn tối đa</p>
                  <p className="mt-1 text-sm font-medium">
                    {new Intl.DateTimeFormat('vi-VN', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(deadline)}
                  </p>
                  <p className={`mt-1 text-xs font-semibold ${
                    isUrgent ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    Còn {daysLeft} ngày để hủy
                  </p>
                </div>

                <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Chọn lý do hủy</p>
                <div className="space-y-2">
                  {cancelReasonOptions.map((reason) => (
                    <label key={reason} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--line)] p-3 transition-colors hover:bg-[var(--surface-muted)]">
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={cancelReason === reason}
                        onChange={(event) => onCancelReasonChange(event.target.value as (typeof cancelReasonOptions)[number])}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-secondary)]">{reason}</span>
                    </label>
                  ))}
                </div>
                <Button
                  onClick={onCancelRequest}
                  disabled={isSubmittingCancel}
                  className="mt-4 w-full bg-red-600 text-white hover:bg-red-700"
                >
                  {isSubmittingCancel ? 'Đang gửi...' : 'Gửi yêu cầu hủy'}
                </Button>
              </>
            )
          })()}
        </div>
      ) : null}

      {order.status === 'received' ? (
        <div className={`${cardClass} p-4 sm:p-5`}>
          <p className="mb-3 text-base font-semibold text-[var(--text-primary)]">Đánh giá sản phẩm</p>
          <OrderReviewSection
            items={order.items}
            ratingByProduct={ratingByProduct}
            commentByProduct={commentByProduct}
            reviewImagesByProduct={reviewImagesByProduct}
            reviewSubmittingForProduct={reviewSubmittingForProduct}
            submittedReviewByProduct={submittedReviewByProduct}
            onRatingChange={onRatingChange}
            onCommentChange={onCommentChange}
            onSelectImages={onSelectImages}
            onRemoveImage={onRemoveImage}
            onSubmitReview={onSubmitReview}
          />
        </div>
      ) : null}
    </div>
  )
}
