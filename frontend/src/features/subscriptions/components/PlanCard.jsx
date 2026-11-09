import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button.jsx'
import { Badge } from '../../../components/ui/Badge.jsx'
import { useCreateCheckoutSession, useMySubscription } from '../hooks/useSubscriptions.js'

const FEATURES = {
  FREE: [
    '3 gallery photos',
    '3 services listed',
    '2 portfolio projects',
    '5 posts & updates',
    'Standard directory listing',
  ],
  BASIC: [
    '10 gallery photos',
    '10 services listed',
    '10 portfolio projects',
    '20 posts & updates',
    'Unlimited social links',
    'Standard analytics',
  ],
  PRO: [
    '30 gallery photos',
    '50 services listed',
    '50 portfolio projects',
    '100 posts & updates',
    'Verified badge',
    'Featured placement in search',
    'Priority support',
  ],
  BUSINESS: [
    'Unlimited gallery photos',
    'Unlimited services & portfolio',
    'Unlimited posts',
    'Top search placement',
    'Verified badge',
    'Dedicated support & priority',
  ],
}

export function PlanCard({ plan, currentPlanName, status }) {
  const navigate = useNavigate()
  const { data: mySub } = useMySubscription()
  const checkout = useCreateCheckoutSession()
  const isLoggedIn = !!localStorage.getItem('accessToken')
  const subStatus = status || mySub?.status
  const isExpired = subStatus === 'EXPIRED'
  const isCurrent = plan.name === (currentPlanName || mySub?.plan?.name)
  const isFree = plan.name === 'FREE'
  const isFeatured = plan.is_featured && plan.name === 'PRO'
  const features = FEATURES[plan.name] || []

  function handleSubscribe() {
    if (isFree) return
    if (!isLoggedIn) { navigate('/register', { state: { from: '/pricing' } }); return }
    checkout.mutate({ planId: plan.id })
  }

  return (
    <div className={`relative flex flex-col bg-surface rounded-xl overflow-hidden transition-all duration-200 ${
      isFeatured ? 'border-2 border-brand shadow-lg' :
      isCurrent  ? 'border-2 border-brand/30' :
      'border border-border hover:border-border-2 hover:shadow-sm'
    }`}>
      {isFeatured && (
        <div className="bg-brand text-white text-[11px] font-semibold tracking-widest text-center py-1.5 uppercase">
          Most popular
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[15px] font-bold text-ink">{plan.display_name}</h3>
          {isCurrent && (
            <Badge variant={isExpired ? 'danger' : 'brand'} size="xs">
              {isExpired ? 'Expired' : 'Current'}
            </Badge>
          )}
        </div>

        <div className="mt-3 mb-5">
          {plan.price_etb === 0 ? (
            <div className="text-3xl font-bold text-ink tracking-tight">Free</div>
          ) : (
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-ink tracking-tight">
                ETB {Number(plan.price_etb).toLocaleString()}
              </span>
              <span className="text-ink-3 text-sm mb-0.5">/mo</span>
            </div>
          )}
        </div>

        <ul className="flex flex-col gap-2.5 mb-6 flex-1">
          {features.map(f => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-ink-2">
              <Check size={13} className="text-brand mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {isCurrent ? (
          isExpired ? (
            <Button
              variant="primary"
              fullWidth
              loading={checkout.isPending && checkout.variables?.planId === plan.id}
              onClick={handleSubscribe}
            >
              Reactivate {plan.display_name}
            </Button>
          ) : (
            <div className="w-full h-9 flex items-center justify-center rounded border border-border text-[13px] text-ink-3 font-medium bg-surface-2">
              Current plan
            </div>
          )
        ) : isFree ? (
          <div className="w-full h-9 flex items-center justify-center rounded border border-border text-[13px] text-ink-3 font-medium">
            {isExpired ? 'Downgraded Free Tier' : 'Always free'}
          </div>
        ) : (
          <Button
            variant={isFeatured ? 'primary' : 'outline'}
            fullWidth
            loading={checkout.isPending && checkout.variables?.planId === plan.id}
            onClick={handleSubscribe}
          >
            {isLoggedIn ? (isExpired ? `Switch to ${plan.display_name}` : 'Subscribe') : 'Get started'}
          </Button>
        )}
      </div>
    </div>
  )
}
