import { OptimizerAPI } from '../../Api'
import PillInput, { Pill } from './PillInput'
import { Environmental, Weight } from './WeightOptions'
import React, { ReactElement, useContext, useState } from 'react'
// @ts-ignore
import { CircularProgress, Typography, Button, TextField, Accordion } from '@equinor/eds-core-react'
import { Products } from '../../Types'
import styled from 'styled-components'
import { Tooltip } from '../Common/Tooltip'
import { ErrorToast } from '../Common/Toast'
import { AuthContext, ParticleSizeContext } from '../../Context'

const { AccordionItem, AccordionHeader, AccordionPanel } = Accordion

interface OptimizationContainerProps {
  products: Products
  enabledProducts: Array<string>
  mode: string
  value: number
  handleUpdate: Function
}

const Wrapper = styled.div`
  padding: 10px 0 10px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 250px;
  width: fit-content;
`

const getWeightPercentages = (weight: Weight) => {
  const { fit, co2, cost, mass } = weight
  let sum: number = fit + co2 + cost + mass
  return {
    best_fit: 100 * (fit / sum),
    mass_fit: 100 * (mass / sum),
    co2: 100 * (co2 / sum),
    cost: 100 * (cost / sum),
  }
}

const OptimizationRunner = ({
  enabledProducts,
  mode,
  value,
  handleUpdate,
}: OptimizationContainerProps): ReactElement => {
  const [failedRun, setFailedRun] = useState<boolean>(false)
  const [invalidInput, setInvalidInput] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const apiToken: string = useContext(AuthContext)?.token
  const [iterations, setIterations] = useState<number>(2000)
  const [maxProducts, setMaxProducts] = useState<number>(999)
  const [pill, setPill] = useState<Pill>({
    volume: 10,
    density: 350,
    mass: 3500,
  })
  const [weight, setWeight] = useState<Weight>({
    fit: 5,
    co2: 0,
    cost: 0,
    mass: 5,
    environmental: [Environmental.GREEN, Environmental.BLACK, Environmental.RED, Environmental.YELLOW],
  })
  const particleRange = useContext(ParticleSizeContext)

  const handleOptimize = () => {
    if (enabledProducts.length === 0) {
      alert('Select at least 1 product before running the optimizer')
      return null
    }
    setLoading(true)
    OptimizerAPI.postOptimizerApi(apiToken, {
      request: 'OPTIMAL_MIX',
      name: 'Optimal Blend',
      iterations: iterations,
      particleRange: [particleRange.from, particleRange.to],
      maxProducts: maxProducts,
      value: value,
      option: mode,
      mass: pill.mass,
      environmental: weight.environmental,
      products: enabledProducts,
      weights: getWeightPercentages(weight),
    })
      .then(response => {
        setFailedRun(false)
        setLoading(false)
        handleUpdate(response.data)
      })
      .catch(error => {
        ErrorToast(`${error.response.data}`, error.response.status)
        setLoading(false)
        setFailedRun(true)
      })
  }

  return (
    <Wrapper>
      <Typography variant='h3' style={{ paddingBottom: '2rem' }}>
        Optimizer
      </Typography>
      <PillInput pill={pill} setPill={setPill} isLoading={loading} setInvalidInput={setInvalidInput} />
      <Accordion>
        <AccordionItem>
          <AccordionHeader>Advanced options</AccordionHeader>
          <AccordionPanel>
            <div>
              <div style={{ paddingBottom: '10px', maxWidth: '130px' }}>
                <Tooltip text={'Number of iterations the optimizer will run.'}>
                  <TextField
                    type='number'
                    variant={(iterations <= 0 && 'error') || undefined}
                    label='Number of iterations'
                    id='interations'
                    value={iterations}
                    onChange={(event: any) => {
                      if (event.target.value === '') setIterations(0)
                      const newValue = parseInt(event.target.value)
                      if (Math.sign(newValue) >= 0) setIterations(newValue)
                    }}
                    disabled={loading}
                  />
                </Tooltip>
              </div>
              <div style={{ paddingBottom: '10px', maxWidth: '130px' }}>
                <Tooltip text={'Maximum number of products the optimizer should try to include in the combination'}>
                  <TextField
                    type='number'
                    label='Max number of products'
                    id='maxProducts'
                    value={maxProducts}
                    onChange={(event: any) => {
                      if (event.target.value === '') setMaxProducts(0)
                      const newValue = parseInt(event.target.value)
                      if (Math.sign(newValue) >= 0) setMaxProducts(newValue)
                    }}
                    disabled={loading}
                  />
                </Tooltip>
              </div>
              <div style={{ margin: '10px 0' }}>
                <Tooltip text={'A range in microns which should be considered in the optimization'}>
                  <Typography variant='body_short'>Particle sizes to consider</Typography>
                </Tooltip>
              </div>
              <ParticleSizeContext.Consumer>
                {({ from, to, setRange }) => (
                  <div style={{ display: 'flex' }}>
                    <div style={{ padding: '0 15px', width: '100px' }}>
                      <TextField
                        id='part-from'
                        type='number'
                        label='From'
                        meta='μm'
                        value={from}
                        onChange={(event: any) => {
                          if (event.target.value === '') setRange([0, to])
                          const newValue = parseFloat(event.target.value)
                          if (Math.sign(newValue) >= 0) setRange([newValue, to])
                        }}
                        disabled={loading}
                      />
                    </div>
                    <div style={{ padding: '0 15px', width: '100px' }}>
                      <TextField
                        id='part-to'
                        type='number'
                        label='To'
                        meta='μm'
                        value={to}
                        onChange={(event: any) => {
                          if (event.target.value === '') setRange([from, 0])
                          const newValue = parseFloat(event.target.value)
                          if (Math.sign(newValue) >= 0) setRange([from, newValue])
                        }}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </ParticleSizeContext.Consumer>
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      <div style={{ display: 'flex', padding: '16px 0' }}>
        <Button onClick={() => handleOptimize()} disabled={loading || invalidInput || iterations <= 0}>
          Run optimizer
        </Button>
        {loading && <CircularProgress style={{ padding: '0 15px', height: '35px', width: '35px' }} />}
      </div>

      {failedRun && <p style={{ color: 'red' }}>Failed to run the optimizer</p>}
      {/* Disabled until supported in API and the needed data is available*/}
      {/*<WeightOptions weight={weight} setWeight={setWeight} isLoading={isLoading} />*/}
    </Wrapper>
  )
}

export default OptimizationRunner
