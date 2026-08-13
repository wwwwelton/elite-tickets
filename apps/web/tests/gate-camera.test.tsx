import { render, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CameraScanner } from "@/components/gate/camera-scanner";

type DecodeCallback = (result: { data: string }) => void;

const { instances, MockQrScanner } = vi.hoisted(() => {
  class MockQrScanner {
    static WORKER_PATH = "";
    start = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn();
    destroy = vi.fn();
    emit: (data: string) => void = () => {};

    constructor(_video: unknown, onDecode: DecodeCallback) {
      this.emit = (data: string) => onDecode({ data });
      instances.push(this);
    }
  }

  const instances: InstanceType<typeof MockQrScanner>[] = [];
  return { instances, MockQrScanner };
});

vi.mock("qr-scanner", () => ({ default: MockQrScanner }));

beforeEach(() => {
  instances.length = 0;
});

describe("camera scanner", () => {
  it("reports decoded credentials to the caller", async () => {
    const onDecode = vi.fn();
    render(<CameraScanner active onDecode={onDecode} />);

    await waitFor(() => expect(instances).toHaveLength(1));
    instances[0].emit("credential-123");

    expect(onDecode).toHaveBeenCalledWith("credential-123");
  });

  it("starts on mount and stops once inactive", async () => {
    const { rerender } = render(<CameraScanner active onDecode={vi.fn()} />);

    await waitFor(() => expect(instances[0]?.start).toHaveBeenCalledTimes(1));

    rerender(<CameraScanner active={false} onDecode={vi.fn()} />);
    expect(instances[0].stop).toHaveBeenCalled();
  });

  it("tears the scanner down on unmount", async () => {
    const { unmount } = render(<CameraScanner active onDecode={vi.fn()} />);

    await waitFor(() => expect(instances).toHaveLength(1));
    unmount();

    expect(instances[0].stop).toHaveBeenCalled();
    expect(instances[0].destroy).toHaveBeenCalled();
  });
});
