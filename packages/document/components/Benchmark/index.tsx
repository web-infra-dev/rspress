import { useState } from 'react';
import { Tabs, Tab } from 'rspress/theme';
import { NoSSR, useI18n } from 'rspress/runtime';
import { ProgressBar } from './ProgressBar';

const BENCHMARK_DATA = {
  start: [
    {
      name: 'Rspress',
      // The unit is seconds
      time: 0.786,
    },
    {
      name: 'Docusaurus',
      time: 8.46,
    },
    {
      name: 'Nextra',
      time: 8.2,
    },
  ],
  hmr: [
    {
      name: 'Rspress',
      time: 0.07,
    },
    {
      name: 'Docusaurus',
      time: 0.12,
    },
    {
      name: 'Nextra',
      time: 0.18,
    },
  ],
  build: [
    {
      name: 'Rspress',
      time: 2.51,
    },
    {
      name: 'Docusaurus',
      time: 14.91,
    },
    {
      name: 'Nextra',
      time: 17.25,
    },
  ],
};

export function Benchmark() {
  const SCENE = ['start', 'hmr', 'build'];
  const t = useI18n();
  const [activeScene, setActiveScene] =
    useState<keyof typeof BENCHMARK_DATA>('start');
  const performanceInfoList = BENCHMARK_DATA[activeScene];
  return (
    <NoSSR>
      <div className="relative flex flex-col justify-center py-10 mt-15 h-auto">
        <div
          className="flex flex-col items-center z-1"
          style={{
            padding: '16px 0',
          }}
        >
          <Tabs
            values={SCENE.map(item => ({
              label: t(item as keyof typeof BENCHMARK_DATA),
            }))}
            onChange={index =>
              setActiveScene(SCENE[index] as keyof typeof BENCHMARK_DATA)
            }
            tabPosition="center"
          >
            {SCENE.map(scene => (
              <Tab key={scene}>
                {performanceInfoList.map(info => (
                  <div
                    key={info.name}
                    className="flex flex-center justify-start flex-col sm:flex-row"
                    style={{
                      margin: '16px 16px 16px 0',
                    }}
                  >
                    {
                      <>
                        <p
                          className="mr-2 mb-2 w-20 text-center text-gray-500 dark:text-light-500"
                          style={{ minWidth: '140px' }}
                        >
                          {info.name}
                        </p>
                        <ProgressBar
                          value={info.time}
                          max={Math.max(
                            ...performanceInfoList.map(info => info.time),
                          )}
                        />
                      </>
                    }
                  </div>
                ))}
              </Tab>
            ))}
          </Tabs>
        </div>
      </div>
    </NoSSR>
  );
}
