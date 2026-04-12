import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OrderDetailItem } from '@/types/orderDetail'

interface OrderReviewSectionProps {
  items: OrderDetailItem[]
  ratingByProduct: Record<string, number>
  commentByProduct: Record<string, string>
  reviewImagesByProduct: Record<string, string[]>
  reviewSubmittingForProduct: string | null
  submittedReviewByProduct: Record<string, boolean>
  onRatingChange: (productId: string, rating: number) => void
  onCommentChange: (productId: string, comment: string) => void
  onSelectImages: (productId: string, files: FileList | null) => void
  onRemoveImage: (productId: string, imageIndex: number) => void
  onSubmitReview: (productId: string) => void
}

export function OrderReviewSection({
  items,
  ratingByProduct,
  commentByProduct,
  reviewImagesByProduct,
  reviewSubmittingForProduct,
  submittedReviewByProduct,
  onRatingChange,
  onCommentChange,
  onSelectImages,
  onRemoveImage,
  onSubmitReview,
}: OrderReviewSectionProps) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const key = `${item.productId}-${index}`
        const productId = item.productId
        const selectedRating = ratingByProduct[productId] ?? 5
        const selectedImages = reviewImagesByProduct[productId] ?? []
        const isSubmittingReview = reviewSubmittingForProduct === productId
        const isReviewed = submittedReviewByProduct[productId] === true

        return (
          <div key={key} className="rounded-xl border border-[#ece7dd] bg-[#fffcf8] p-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{item.productName}</p>

            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={`${key}-star-${value}`}
                  type="button"
                  onClick={() => onRatingChange(productId, value)}
                  disabled={isReviewed || isSubmittingReview}
                  className="rounded p-0.5 disabled:cursor-not-allowed"
                >
                  <Star
                    size={18}
                    className={value <= selectedRating ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#c3bcb0]'}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={commentByProduct[productId] ?? ''}
              onChange={(event) => onCommentChange(productId, event.target.value)}
              disabled={isReviewed || isSubmittingReview}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              className="mt-2 h-20 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[#D6C7AB]/50 disabled:cursor-not-allowed disabled:bg-[#f6f3ee]"
            />

            <div className="mt-2">
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                Đính kèm ảnh (tối đa 4 ảnh)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={isReviewed || isSubmittingReview}
                onChange={(event) => {
                  onSelectImages(productId, event.target.files)
                  event.currentTarget.value = ''
                }}
                className="block w-full text-xs text-[var(--text-secondary)] file:mr-2 file:rounded-md file:border file:border-[var(--line)] file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-[var(--text-primary)]"
              />

              {selectedImages.length > 0 ? (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {selectedImages.map((imageUrl, imageIndex) => (
                    <div key={`${key}-img-${imageIndex}`} className="relative overflow-hidden rounded-md border border-[#e6dfd3]">
                      <img
                        src={imageUrl}
                        alt={`review-${imageIndex + 1}`}
                        className="h-16 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveImage(productId, imageIndex)}
                        disabled={isReviewed || isSubmittingReview}
                        className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <Button
              type="button"
              onClick={() => onSubmitReview(productId)}
              disabled={isReviewed || isSubmittingReview}
              className="mt-2 h-9 rounded-full px-4"
            >
              {isReviewed ? 'Đã gửi đánh giá' : isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
