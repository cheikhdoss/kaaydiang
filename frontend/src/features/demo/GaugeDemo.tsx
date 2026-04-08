import { Gauge } from '@/components/ui/gauge'

export const Demo = () => (
  <div className="flex flex-col gap-16 p-6">
    <div className="flex flex-col gap-8">
      <div className="text-xl font-bold text-white">Default</div>
      <div className="flex items-center justify-center gap-8">
        <Gauge value={33} size="tiny" />
        <Gauge value={50} size="small" />
        <Gauge value={75} size="medium" />
        <Gauge value={100} size="large" />
      </div>
    </div>
    <div className="flex flex-col gap-8">
      <div className="text-xl font-bold text-white">Show value</div>
      <div className="flex items-center justify-center gap-8">
        <Gauge value={33} size="medium" showValue />
        <Gauge value={50} size="medium" showValue />
        <Gauge value={75} size="medium" showValue />
      </div>
    </div>
    <div className="flex flex-col gap-8">
      <div className="text-xl font-bold text-white">Custom color range</div>
      <div className="mt-2 flex items-center justify-center gap-8">
        {[...Array(11).keys()].map((value) => (
          <Gauge
            key={value}
            value={value * 10}
            size="small"
            colors={{
              '0': '#420c25',
              '10': '#571032',
              '20': '#5d0c34',
              '30': '#5d0c34',
              '50': '#76063f',
              '60': '#ba0056',
              '70': '#f12b82',
              '80': '#e7006d',
              '90': '#ff4d8d',
              '100': '#ffe9f4',
            }}
          />
        ))}
      </div>
    </div>
  </div>
)

export const Default = () => (
  <div className="flex flex-col gap-8 p-6">
    <div className="flex flex-col gap-8">
      <div className="text-xl font-bold text-white">Default</div>
      <div className="flex items-center justify-center gap-8">
        <Gauge value={33} size="tiny" />
        <Gauge value={50} size="small" />
        <Gauge value={75} size="medium" />
        <Gauge value={100} size="large" />
      </div>
    </div>
  </div>
)

export const ShowValue = () => (
  <div className="flex flex-col gap-8 p-6">
    <div className="text-xl font-bold text-white">Show value</div>
    <div className="flex items-center justify-center gap-8">
      <Gauge value={80} size="small" showValue />
      <Gauge value={100} size="small" showValue />
      <Gauge value={80} size="medium" showValue />
      <Gauge value={100} size="medium" showValue />
      <Gauge value={80} size="large" showValue />
      <Gauge value={100} size="large" showValue />
    </div>
  </div>
)

export const DefaultColorScale = () => (
  <div className="flex flex-col gap-8 p-6">
    <div className="text-xl font-bold text-white">Default color scale</div>
    <div className="mt-2 flex items-center justify-center gap-8">
      <Gauge value={14} />
      <Gauge value={34} />
      <Gauge value={68} />
    </div>
  </div>
)

export const ArcPriority = () => (
  <div className="flex flex-col gap-8 p-6">
    <div className="text-xl font-bold text-white">Arc priority</div>
    <div className="mt-2 flex items-center justify-center gap-8">
      <Gauge
        arcPriority="equal"
        value={80}
        showValue
        colors={{
          primary: '#006efe',
          secondary: '#f13242',
        }}
      />
    </div>
  </div>
)

export const CustomColorRange = () => (
  <div className="flex flex-col gap-8 p-6">
    <div className="text-xl font-bold text-white">Custom color range</div>
    <div className="mt-2 flex items-center justify-center gap-8">
      {[...Array(11).keys()].map((value) => (
        <Gauge
          key={value}
          value={value * 10}
          size="small"
          colors={{
            '0': '#420c25',
            '10': '#571032',
            '20': '#5d0c34',
            '30': '#5d0c34',
            '50': '#76063f',
            '60': '#ba0056',
            '70': '#f12b82',
            '80': '#e7006d',
            '90': '#ff4d8d',
            '100': '#ffe9f4',
          }}
        />
      ))}
    </div>
  </div>
)

export const CustomSecondaryColor = () => (
  <div className="flex flex-col gap-8 p-6">
    <div className="text-xl font-bold text-white">Custom secondary color</div>
    <div className="mt-2 flex items-center justify-center gap-8">
      <Gauge
        value={50}
        colors={{
          primary: '#006efe',
          secondary: '#002f62',
        }}
      />
    </div>
  </div>
)

export const Indeterminate = () => (
  <div className="flex flex-col gap-8 p-6">
    <div className="text-xl font-bold text-white">Indeterminate</div>
    <div className="flex items-center justify-center gap-8">
      <Gauge indeterminate value={25} size="tiny" />
      <Gauge indeterminate value={25} size="small" />
      <Gauge indeterminate value={25} size="medium" />
      <Gauge indeterminate value={25} size="large" />
    </div>
  </div>
)
