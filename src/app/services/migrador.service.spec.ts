import { TestBed } from '@angular/core/testing';

import { MigradorService } from './migrador.service';

describe('MigradorService', () => {
  let service: MigradorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MigradorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
