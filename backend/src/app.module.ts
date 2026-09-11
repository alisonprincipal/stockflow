import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';
import { DashboardController } from './dashboard.controller';
@Module({controllers:[ProductsController,MovementsController,DashboardController],providers:[PrismaService,ProductsService,MovementsService]}) export class AppModule {}
