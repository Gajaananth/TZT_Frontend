// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { router } from './app.router';

describe('app router', () => {
  it('includes exam creation, grading, and discussion routes', () => {
    const paths = router.routes.map((route) => route.path);

    expect(paths).toContain('/exams/new');
    expect(paths).toContain('/grading');
    expect(paths).toContain('/discussions');
  });
});
