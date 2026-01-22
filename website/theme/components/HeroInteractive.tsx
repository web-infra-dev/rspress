import { useLang } from '@rspress/core/runtime';
import React, { useState } from 'react';
import styles from './HeroInteractive.module.scss';

export function HeroInteractive() {
  const lang = useLang();
  // Using generic text as I don't have the exact text from the image for all items
  const t = {
    title: 'Vibe Kanban',
    desc:
      lang === 'zh'
        ? 'All-in-one Rspress 导航插件'
        : 'All-in-one Rspress navigation plugin',
    items: [
      { id: 1, text: 'Integrated into Rspress', checked: true },
      { id: 2, text: 'Easy to use', checked: true },
      { id: 3, text: 'Highly customizable', checked: true },
      { id: 4, text: 'Support for custom components', checked: false },
    ],
  };

  const [items, setItems] = useState(t.items);

  const toggleItem = (id: number) => {
    setItems(
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon}></div>
        <span className={styles.title}>{t.title}</span>
      </div>
      <p className={styles.desc}>{t.desc}</p>
      <div className={styles.list}>
        {items.map(item => (
          <div
            key={item.id}
            className={`${styles.item} ${item.checked ? styles.checked : ''}`}
            onClick={() => toggleItem(item.id)}
          >
            <div className={styles.checkbox}>
              {item.checked && (
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
