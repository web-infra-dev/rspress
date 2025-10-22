import {
  Benchmark as BaseBenchmark,
  type BenchmarkData,
} from '@rstack-dev/doc-ui/benchmark';
import './index.scss';

const BENCHMARK_DATA: BenchmarkData = {
  rspress: {
    label: 'Rspress',
    metrics: [
      {
        time: 0.07,
        desc: 'hmr',
      },
      {
        time: 0.786,
        desc: 'dev',
      },
      {
        time: 2.51,
        desc: 'build',
      },
    ],
  },
  docusaurus: {
    label: 'Docusaurus',
    metrics: [
      {
        time: 0.12,
        desc: 'hmr',
      },
      {
        time: 8.46,
        desc: 'dev',
      },
      {
        time: 14.91,
        desc: 'build',
      },
    ],
  },
  nextra: {
    label: 'Nextra',
    metrics: [
      {
        time: 0.18,
        desc: 'hmr',
      },
      {
        time: 8.2,
        desc: 'dev',
      },
      {
        time: 17.25,
        desc: 'build',
      },
    ],
  },
};

export function Benchmark() {
  return <BaseBenchmark data={BENCHMARK_DATA} />;
}
