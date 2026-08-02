import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (user && user.companyId) {
      // Inject the companyId into the request body or query for downstream use
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        request.body.companyId = user.companyId;
      }
    }
    
    return next.handle();
  }
}
