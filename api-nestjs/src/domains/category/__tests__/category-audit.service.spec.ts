import { Test, TestingModule } from '@nestjs/testing';
import { CategoryAuditService } from '../services/category-audit.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { MockServicesFactory } from '../../../test/utils/test-helpers';

describe('CategoryAuditService', () => {
    let service: CategoryAuditService;
    let prisma: any;

    beforeEach(async () => {
        prisma = MockServicesFactory.createMockPrismaService();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoryAuditService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        service = module.get<CategoryAuditService>(CategoryAuditService);
    });

    describe('logAction', () => {
        it('should create an audit log entry', async () => {
            const categoryId = 'cat-123';
            const action = 'UPDATE';
            const userId = 'user-1';
            const oldValues = { name: 'Old' };
            const newValues = { name: 'New' };

            await service.logAction(categoryId, action, userId, oldValues, newValues);

            expect(prisma.categoryAuditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    categoryId,
                    action,
                    userId,
                    oldValues: expect.any(Object),
                    newValues: expect.any(Object),
                    changes: expect.any(Object),
                }),
            });
        });

        it('should handle tree operations with old/new paths', async () => {
            const categoryId = 'cat-123';
            const action = 'MOVE';
            const userId = 'user-1';
            const oldValues = { path: '/old/path', parentId: 'old-p' };
            const newValues = { path: '/new/path', parentId: 'new-p' };

            await service.logAction(categoryId, action, userId, oldValues, newValues);

            expect(prisma.categoryAuditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'MOVE',
                    oldPath: '/old/path',
                    newPath: '/new/path',
                    oldParentId: 'old-p',
                    newParentId: 'new-p',
                }),
            });
        });
    });
});
