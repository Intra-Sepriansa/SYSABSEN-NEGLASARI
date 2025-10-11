import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VideoPane from '../../src/components/VideoPane';

vi.mock('react-youtube', () => ({
  __esModule: true,
  default: ({ videoId }: { videoId: string }) => <div data-testid="youtube" data-id={videoId} />
}));

describe('VideoPane', () => {
  it('passes videoId to YouTube component', () => {
    const { getByTestId } = render(<VideoPane videoId="abc123" />);
    expect(getByTestId('youtube')).toHaveAttribute('data-id', 'abc123');
  });
});
