import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
@Injectable() export class ProductsService {
 constructor(private db:PrismaService){}
 findAll(search?:string){return this.db.product.findMany({where:search?{OR:[{name:{contains:search,mode:'insensitive'}},{sku:{contains:search,mode:'insensitive'}}]}:undefined,orderBy:{name:'asc'}})}
 async findOne(id:number){const p=await this.db.product.findUnique({where:{id}});if(!p)throw new NotFoundException('Produto não encontrado');return p}
 async create(b:any){if(!b.name||!b.sku||!b.category)throw new BadRequestException('Nome, SKU e categoria são obrigatórios');if(Number(b.quantity)<0||Number(b.minimumStock)<0)throw new BadRequestException('Quantidades inválidas');try{return await this.db.product.create({data:{name:b.name,sku:b.sku,category:b.category,quantity:Number(b.quantity||0),minimumStock:Number(b.minimumStock||0),costPrice:b.costPrice==null||b.costPrice===''?undefined:Number(b.costPrice)}})}catch(e:any){if(e.code==='P2002')throw new ConflictException('SKU já cadastrado');throw e}}
 async update(id:number,b:any){await this.findOne(id);try{return await this.db.product.update({where:{id},data:{...b,quantity:b.quantity==null?undefined:Number(b.quantity),minimumStock:b.minimumStock==null?undefined:Number(b.minimumStock),costPrice:b.costPrice===''?null:b.costPrice==null?undefined:Number(b.costPrice)}})}catch(e:any){if(e.code==='P2002')throw new ConflictException('SKU já cadastrado');throw e}}
 async remove(id:number){await this.findOne(id);const n=await this.db.stockMovement.count({where:{productId:id}});if(n)throw new BadRequestException('Produto com movimentações não pode ser excluído');return this.db.product.delete({where:{id}})}
}
