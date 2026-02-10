declare module 'kalman-filter' {
  interface KalmanFilterOptions {
    observation?: number
    dynamic?: number
  }

  interface KalmanFilterState {
    mean: number[]
    covariance: number[][]
  }

  class KalmanFilter {
    constructor(options: KalmanFilterOptions)
    filter(data: { observation: number[] }): KalmanFilterState
  }

  export default KalmanFilter
}
