"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; label?: string };
type State = { error: Error | null };

/**
 * يمنع خطأ في شاشة واحدة من إسقاط التطبيق كلّه.
 * في منصّة تعرض أربعة أجهزة معًا، سقوط واحد كان يُسقط البقية.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        data-matam
        className="flex h-full flex-col items-center justify-center gap-3 bg-m-bg p-6 text-center"
      >
        <p className="text-sm font-medium text-m-danger">
          تعذّر عرض {this.props.label ?? "هذه الشاشة"}
        </p>
        <p className="max-w-xs text-xs leading-relaxed text-m-dim">{error.message}</p>
        <button
          onClick={() => this.setState({ error: null })}
          className="rounded-xl bg-m-accent px-4 py-2 text-xs font-bold text-white"
        >
          أعد المحاولة
        </button>
      </div>
    );
  }
}
