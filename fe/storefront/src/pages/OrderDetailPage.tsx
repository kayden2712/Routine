import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import { Button } from '@/components/ui/button'
import { OrderSidebarPanel } from '@/components/order/OrderSidebarPanel'
import { OrderTimeline } from '@/components/order/OrderTimeline'
import { useEffect, useState } from 'react'
import {
  extractApologyLineFromNotes,
  extractShippingInfoFromNotes,
  filesToDataUrls,
  mergeLimitedImages,
  type ShippingInfo,
} from '@/lib/orderDetailUtils'
import {
  confirmCompletedOrderApi,
  fetchMyOrdersApi,
  fetchProductsApi,
  requestOrderCancellationApi,
  requestOrderReturnApi,
  submitOrderProductReviewApi,
  revokeOrderCancellationApi,
} from '@/lib/backendApi'
import { buildOrderDetailTracking, cancelReasonOptions, orderStatusColorMap, orderStatusLabelMap } from '@/lib/orderStatus'
import { ORDER_STATUS_CHANGED_TOPIC, resolveWebSocketUrl } from '@/lib/websocket'
import { formatVnd } from '@/lib/utils'
import type { OrderDetail, OrderDetailItem } from '@/types/orderDetail'
import type { OrderStatusChangedEvent } from '@/types/order'

export const OrderDetailPage = () => {

  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)
  const [isConfirmingComplete, setIsConfirmingComplete] = useState(false)
  const [isRevokingCancel, setIsRevokingCancel] = useState(false)
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false)
  const [cancelReason, setCancelReason] = useState<(typeof cancelReasonOptions)[number]>(cancelReasonOptions[0])
  const [ratingByProduct, setRatingByProduct] = useState<Record<string, number>>({})
  const [commentByProduct, setCommentByProduct] = useState<Record<string, string>>({})
  const [reviewImagesByProduct, setReviewImagesByProduct] = useState<Record<string, string[]>>({})
  const [reviewSubmittingForProduct, setReviewSubmittingForProduct] = useState<string | null>(null)
  const [submittedReviewByProduct, setSubmittedReviewByProduct] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const [orders, products] = await Promise.all([
          fetchMyOrdersApi(),
          fetchProductsApi(),
        ])

        const found = orders.find((o) => o.id === orderId)
        if (!found) {
          setLoading(false)
          return
        }

        const productMap = new Map(products.map((p) => [p.id, p]))

        const shippingInfo: ShippingInfo = extractShippingInfoFromNotes(found.notes)
        const apologyLine = extractApologyLineFromNotes(found.notes)

        const orderDetail: OrderDetail = {
          orderId: found.id,
          orderNumber: found.orderNumber,
          status: found.status,
          subtotal: found.subtotal ?? 0,
          discount: found.discount ?? 0,
          total: found.total,
          notes: found.notes,
          items: found.items.map((item) => ({
            ...item,
            id: item.productId,
            image: productMap.get(item.productId)?.image,
          })) as OrderDetailItem[],
          createdAt: found.createdAt,
          deliveredAt: found.deliveredAt,
          shippingInfo,
          tracking: buildOrderDetailTracking(found.status),
        }

        if (apologyLine) {
          orderDetail.notes = apologyLine
        }

        setOrder(orderDetail)
        const initialRatings = found.items.reduce<Record<string, number>>((acc, item) => {
          acc[item.productId] = 5
          return acc
        }, {})
        const initialComments = found.items.reduce<Record<string, string>>((acc, item) => {
          acc[item.productId] = ''
          return acc
        }, {})
        setRatingByProduct(initialRatings)
        setCommentByProduct(initialComments)
        setReviewImagesByProduct({})
        setSubmittedReviewByProduct({})
      } catch (error) {
        console.error('Lỗi khi tải thông tin đơn hàng:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadOrder()
  }, [orderId])

  useEffect(() => {
    if (!orderId) {
      return
    }

    let cancelled = false
    let subscription: StompSubscription | null = null

    const refreshOrderStatus = async () => {
      try {
        const orders = await fetchMyOrdersApi()
        if (cancelled) return

        const found = orders.find((o) => o.id === orderId)
        if (!found) return

        const apologyLine = extractApologyLineFromNotes(found.notes)

        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: found.status,
                subtotal: found.subtotal ?? prev.subtotal,
                discount: found.discount ?? prev.discount,
                total: found.total,
                notes: apologyLine ?? found.notes,
                deliveredAt: found.deliveredAt,
                tracking: buildOrderDetailTracking(found.status),
              }
            : null,
        )
      } catch (error) {
        console.error('Không thể tự cập nhật trạng thái đơn hàng:', error)
      }
    }

    const wsClient = new Client({
      brokerURL: resolveWebSocketUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        subscription = wsClient.subscribe(ORDER_STATUS_CHANGED_TOPIC, (message: IMessage) => {
          let event: OrderStatusChangedEvent | null = null
          if (message.body) {
            try {
              event = JSON.parse(message.body) as OrderStatusChangedEvent
            } catch {
              event = null
            }
          }
          if (event?.orderId != null && String(event.orderId) !== orderId) {
            return
          }
          void refreshOrderStatus()
        })
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event)
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'], frame.body)
      },
    })

    wsClient.activate()

    return () => {
      cancelled = true
      subscription?.unsubscribe()
      wsClient.deactivate()
    }
  }, [orderId])

  const handleCancelRequest = async () => {
    if (!order) return
    setIsSubmittingCancel(true)
    try {
      await requestOrderCancellationApi(order.orderId, cancelReason)
      // Reload order
      const orders = await fetchMyOrdersApi()
      const found = orders.find((o) => o.id === orderId)
      if (found) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: found.status,
                tracking: buildOrderDetailTracking(found.status),
              }
            : null,
        )
      }
      setShowCancelForm(false)
    } catch (error) {
      console.error('Lỗi khi hủy đơn:', error)
    } finally {
      setIsSubmittingCancel(false)
    }
  }

  const handleConfirmCompleted = async () => {
    if (!order) return

    setIsConfirmingComplete(true)
    try {
      await confirmCompletedOrderApi(order.orderId)
      const orders = await fetchMyOrdersApi()
      const found = orders.find((o) => o.id === orderId)
      if (found) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: found.status,
                tracking: buildOrderDetailTracking(found.status),
              }
            : null,
        )
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận hoàn thành đơn hàng:', error)
    } finally {
      setIsConfirmingComplete(false)
    }
  }

  const handleRefundRequest = async () => {
    if (!order) return

    setIsSubmittingRefund(true)
    try {
      await requestOrderReturnApi(order.orderId, 'Khách hàng yêu cầu hoàn tiền')
      const orders = await fetchMyOrdersApi()
      const found = orders.find((o) => o.id === orderId)
      if (found) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: found.status,
                notes: found.notes,
                tracking: buildOrderDetailTracking(found.status),
              }
            : null,
        )
      }
    } catch (error) {
      console.error('Lỗi khi yêu cầu hoàn tiền:', error)
    } finally {
      setIsSubmittingRefund(false)
    }
  }

  const handleRevokeCancelRequest = async () => {
    if (!order) return

    setIsRevokingCancel(true)
    try {
      await revokeOrderCancellationApi(order.orderId)
      const orders = await fetchMyOrdersApi()
      const found = orders.find((o) => o.id === orderId)
      if (found) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: found.status,
                tracking: buildOrderDetailTracking(found.status),
              }
            : null,
        )
      }
    } catch (error) {
      console.error('Lỗi khi hủy yêu cầu hủy đơn:', error)
    } finally {
      setIsRevokingCancel(false)
    }
  }

  const handleSubmitProductReview = async (productId: string) => {
    if (!order) return

    const rating = ratingByProduct[productId] ?? 5
    const comment = (commentByProduct[productId] ?? '').trim()
    const imageUrls = reviewImagesByProduct[productId] ?? []

    setReviewSubmittingForProduct(productId)
    try {
      await submitOrderProductReviewApi(order.orderId, {
        productId,
        rating,
        comment,
        imageUrls,
      })
      setSubmittedReviewByProduct((prev) => ({ ...prev, [productId]: true }))
      setReviewImagesByProduct((prev) => ({ ...prev, [productId]: [] }))
      window.alert('Đánh giá thành công. Cảm ơn bạn đã đánh giá sản phẩm.')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Không thể gửi đánh giá. Vui lòng thử lại.')
    } finally {
      setReviewSubmittingForProduct(null)
    }
  }

  const handleSelectReviewImages = async (productId: string, files: FileList | null) => {
    if (!files) return

    const pickedFiles = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 4)

    if (pickedFiles.length === 0) {
      return
    }

    try {
      const dataUrls = await filesToDataUrls(pickedFiles)
      setReviewImagesByProduct((prev) => {
        const existing = prev[productId] ?? []
        const merged = mergeLimitedImages(existing, dataUrls)
        return {
          ...prev,
          [productId]: merged,
        }
      })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Không thể đính kèm ảnh.')
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-[1100px] px-4 py-8 sm:px-8">
        <p className="text-sm text-[var(--text-secondary)]">Đang tải...</p>
      </section>
    )
  }

  if (!order) {
    return (
      <section className="mx-auto max-w-[1100px] px-4 py-8 sm:px-8">
        <Button asChild variant="outline" className="mb-6">
          <Link to="/account" className="inline-flex items-center gap-2">
            <ChevronLeft size={16} />
            Quay lại
          </Link>
        </Button>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-8 text-center">
          <p className="text-[var(--text-secondary)]">Không tìm thấy đơn hàng</p>
        </div>
      </section>
    )
  }

  const statusColor = orderStatusColorMap[order.status]
  const apologyMessage =
    order.notes && /xin loi|xin lỗi/i.test(order.notes)
      ? order.notes
      : order.status === 'cancelled'
        ? 'Xin lỗi quý khách, đơn hàng đã được cửa hàng hủy. Nếu cần hỗ trợ thêm vui lòng liên hệ cửa hàng.'
        : null
  const estimatedDeliveryDate = new Date(order.createdAt)
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3)
  const shellClass =
    'rounded-[28px] border border-[#e9e4da] bg-white p-4 shadow-[0_10px_30px_rgba(26,26,24,0.04)] sm:p-6'
  const cardClass =
    'rounded-2xl border border-[#ece7dd] bg-white shadow-[0_1px_0_rgba(26,26,24,0.03)]'

  return (
    <section className="mx-auto max-w-[1160px] px-4 py-8 sm:px-8">
      <Button asChild variant="outline" className="mb-6">
        <Link to="/account" className="inline-flex items-center gap-2">
          <ChevronLeft size={16} />
          Quay lại
        </Link>
      </Button>

      <div className={shellClass}>
        <div className="space-y-5">
        {/* Header */}
        <div className={`flex flex-wrap items-start justify-between gap-4 px-1 py-1 sm:px-2 ${cardClass}`}>
          <div className="px-4 py-3 sm:px-5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Mã đơn hàng #{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Giao dự kiến: {new Intl.DateTimeFormat('vi-VN').format(estimatedDeliveryDate)}
            </p>
          </div>
          <div className="px-4 py-3 sm:px-5">
            <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
              {orderStatusLabelMap[order.status]}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className={`${cardClass} p-5 sm:p-6`}>
          <p className="mb-4 text-base font-semibold text-[var(--text-primary)]">Status đơn hàng</p>
          <OrderTimeline tracking={order.tracking} />
        </div>

        {apologyMessage ? (
          <div className={`${cardClass} border-red-200 bg-red-50 p-4 sm:p-5`}>
            <p className="text-sm font-semibold text-red-700">Thông báo từ cửa hàng</p>
            <p className="mt-1 text-sm text-red-600">{apologyMessage}</p>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
          {/* Products */}
          <div className={`${cardClass} p-5 sm:p-6`}>
            <p className="mb-4 text-base font-semibold text-[var(--text-primary)]">Tất cả sản phẩm</p>
            <div className="space-y-3.5">
              {order.items.map((item, index) => {
                const unitPrice = Number.isFinite(item.price) ? Number(item.price) : 0
                const quantity = Number.isFinite(item.quantity) ? Number(item.quantity) : 0

                return (
                <article
                  key={`${item.id ?? item.productId}-${item.size ?? ''}-${item.color ?? ''}-${index}`}
                  className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-[#f0ece3] bg-[#fffcf8] p-3"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-14 w-14 rounded-md bg-[var(--line)] object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-md bg-[var(--line)]" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.productName}</p>
                    {item.size && item.color ? (
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                        Màu: {item.color} · Size: {item.size}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                      {formatVnd(unitPrice)} × {quantity}
                    </p>
                  </div>

                  <div className="pt-0.5 text-right">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatVnd(unitPrice * quantity)}
                    </p>
                  </div>
                </article>
                )
              })}
            </div>
          </div>

          <OrderSidebarPanel
            order={order}
            cardClass={cardClass}
            showCancelForm={showCancelForm}
            cancelReason={cancelReason}
            isSubmittingCancel={isSubmittingCancel}
            isConfirmingComplete={isConfirmingComplete}
            isRevokingCancel={isRevokingCancel}
            isSubmittingRefund={isSubmittingRefund}
            ratingByProduct={ratingByProduct}
            commentByProduct={commentByProduct}
            reviewImagesByProduct={reviewImagesByProduct}
            reviewSubmittingForProduct={reviewSubmittingForProduct}
            submittedReviewByProduct={submittedReviewByProduct}
            onToggleCancelForm={() => setShowCancelForm((prev) => !prev)}
            onCancelReasonChange={(reason) => setCancelReason(reason)}
            onCancelRequest={() => {
              void handleCancelRequest()
            }}
            onConfirmCompleted={() => {
              void handleConfirmCompleted()
            }}
            onRefundRequest={() => {
              void handleRefundRequest()
            }}
            onRevokeCancelRequest={() => {
              void handleRevokeCancelRequest()
            }}
            onRatingChange={(productId, rating) => {
              setRatingByProduct((prev) => ({ ...prev, [productId]: rating }))
            }}
            onCommentChange={(productId, comment) => {
              setCommentByProduct((prev) => ({ ...prev, [productId]: comment }))
            }}
            onSelectImages={(productId, files) => {
              void handleSelectReviewImages(productId, files)
            }}
            onRemoveImage={(productId, imageIndex) => {
              setReviewImagesByProduct((prev) => ({
                ...prev,
                [productId]: (prev[productId] ?? []).filter((_, idx) => idx !== imageIndex),
              }))
            }}
            onSubmitReview={(productId) => {
              void handleSubmitProductReview(productId)
            }}
          />
        </div>
        </div>
      </div>
    </section>
  )
}
