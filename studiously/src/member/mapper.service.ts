// src/member/mapper.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class MapperService {
  dtoToEntity<T extends object, U extends object>(
    dto: Partial<T>,
    Ctor: new () => U,
  ): U {
    const entity = new Ctor();
    return Object.assign(entity, dto) as U;
  }

  // Entity --> DTO
  entityToDto<T extends object, U extends object>(
    entity: T,
    Ctor: new () => U,
  ): U {
    const dto = new Ctor();
    return Object.assign(dto, entity) as U;
  }

  listEntitiesToListDtos<T extends object, U extends object>(
    entities: T[],
    Ctor: new () => U,
  ): U[] {
    return entities.map((e) => this.entityToDto(e, Ctor));
  }
}
