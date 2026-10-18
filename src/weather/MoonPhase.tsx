// شکل ماه در یک فاز: قرص تیره + بخش روشن (دو کمان). نیمکرهٔ جنوبی آینه می‌شود (ماه رو به رشد در نیمکرهٔ شمالی سمت راست روشن است).
export default function MoonPhase({ phase, fraction, southern = false, size = 46, label }: { phase: number; fraction: number; southern?: boolean; size?: number; label?: string }) {
  const R = 20, C = 24
  const waxing = phase < 0.5
  let lit: React.ReactNode = null
  if (fraction >= 0.985) lit = <circle className="lit" cx={C} cy={C} r={R} />
  else if (fraction > 0.015) {
    const rx = (R * Math.abs(1 - 2 * fraction)).toFixed(2)
    const crescent = fraction < 0.5
    const outer = waxing ? 1 : 0 // کمان بیرونی: رو به رشد از راست، رو به کاهش از چپ
    const term = waxing === crescent ? 0 : 1 // مرز شب‌وروز: هلال به سمت لبهٔ روشن می‌خمد، تربیع‌به‌بالا به سمت مقابل
    lit = <path className="lit" d={`M${C} ${C - R}A${R} ${R} 0 0 ${outer} ${C} ${C + R}A${rx} ${R} 0 0 ${term} ${C} ${C - R}Z`} transform={southern ? `translate(${2 * C} 0) scale(-1 1)` : undefined} />
  }
  return (
    <svg className="wp-moonsvg" viewBox="0 0 48 48" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <circle className="dark" cx={C} cy={C} r={R} />
      {lit}
      <circle className="rim" cx={C} cy={C} r={R} />
    </svg>
  )
}
