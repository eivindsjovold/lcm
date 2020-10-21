import React, { PureComponent } from 'react'
// @ts-ignore
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Product } from '../../gen-api/src/models'
import { ProductResult } from './OptimizationContainer'

class CustomizedAxisTick extends PureComponent {
  render() {
    const {
      // @ts-ignore
      x,
      // @ts-ignore
      y,
      // @ts-ignore
      payload,
    } = this.props

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={8} textAnchor="end" fill="#666" transform="rotate(-60)">
          {payload.value}
        </text>
      </g>
    )
  }
}

interface SolutionBarChartProps {
  products: Map<string, Product>
  optimizationData: any
}

export const SolutionBarChart = ({ optimizationData, products }: SolutionBarChartProps) => {
  const graphData = () => {
    let data: any = []
    if (optimizationData.products.length !== 0) {
      optimizationData.products.map((productResult: ProductResult) => {
        data.push({
          // @ts-ignore
          name: products[productResult.id].id,
          sacks: productResult.sacks,
        })
      })
    }
    return data
  }

  return (
    <BarChart width={300} height={250} data={graphData()} margin={{ top: 15, right: 15 }} barSize={10}>
      <XAxis
        dataKey="name"
        scale="point"
        padding={{ left: 50, right: 50 }}
        height={80}
        interval={0}
        tick={<CustomizedAxisTick />}
      />
      <YAxis />
      <Tooltip />
      <Legend />
      <CartesianGrid strokeDasharray="3 3" />
      <Bar dataKey="sacks" fill="#73B1B5" background={{ fill: '#D6EAF4' }} label={{ position: 'top' }} />
    </BarChart>
  )
}
export default SolutionBarChart