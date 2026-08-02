import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const warehouse = await prisma.warehouse.findFirst();
  if (!warehouse) throw new Error('No warehouse found in DB');
  
  const company = await prisma.company.findUnique({ where: { id: warehouse.companyId } });
  if (!company) throw new Error('Company for warehouse not found');

  const categoriesData = ['Softwood', 'Chaliboard & White Wood', 'Beams & Strips', 'Special Timber Grades'];
  
  const categories: any = {};
  for (const c of categoriesData) {
    categories[c] = await prisma.category.upsert({
      where: { companyId_name: { companyId: company.id, name: c } },
      update: {},
      create: { companyId: company.id, name: c }
    });
  }

  // Wood Types
  const woodTypes = ['سويدي', 'موسكي', 'شاليبورد', 'بياض', 'عروق'];
  const wTypes: any = {};
  for (const w of woodTypes) {
    wTypes[w] = await prisma.woodType.upsert({
      where: { companyId_name: { companyId: company.id, name: w } },
      update: {},
      create: { companyId: company.id, name: w }
    });
  }

  const catalog = [
    { cat: 'Softwood', wood: 'سويدي', name: 'سادس فيدا 8338 (Fida 6)', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'سويدي', name: 'سادس فيدا 6.5 / 4519', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'سويدي', name: 'سادس فيدا 6.5 / 6538', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'سويدي', name: 'سادس فيدا 6.5 / 5922', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'موسكي', name: 'خامس فيدا 5338', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'موسكي', name: 'سابع فيدا 5*1', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'سويدي', name: 'سويد 6.5 / 5*1 UPM', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'موسكي', name: 'خامس مولفين 8338 (Molfen)', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'موسكي', name: 'خامس مولفين + سترا + هولمان + جوليا', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'سويدي', name: 'خامس سوجيزرا 6538 (Sogezira)', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'سويدي', name: 'خامس سوجيزرا 6*2', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'موسكي', name: 'خامس سيترا 8*2 (Setra)', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'موسكي', name: 'خامس سنداسا 6*2 (Sundasa)', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'موسكي', name: 'خامس سنداسا + سيترا 8*2', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'موسكي', name: 'خامس سنداسا 10*2', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'سويدي', name: 'سادس شيروفيت 4516 (Schiroff)', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'سويدي', name: 'سادس شيروفيت 4516 طويل', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'سويدي', name: 'سادس ستر + برجين هولمان 8*2 GF', baseUnit: 'PIECE' },
    { cat: 'Softwood', wood: 'سويدي', name: 'سادس سترا + انيكا 8*2', baseUnit: 'PIECE' },
    { cat: 'Chaliboard & White Wood', wood: 'شاليبورد', name: 'شاليبورد 1 كوهامو 4519 (Kohamo)', baseUnit: 'PIECE' },
    { cat: 'Chaliboard & White Wood', wood: 'شاليبورد', name: 'شاليبورد 1 جوليا 5*1 (Julia)', baseUnit: 'PIECE' },
    { cat: 'Chaliboard & White Wood', wood: 'شاليبورد', name: 'شاليبورد 1 انيكا 4519 (Anika)', baseUnit: 'PIECE' },
    { cat: 'Chaliboard & White Wood', wood: 'شاليبورد', name: 'شاليبورد 2 بولكي 4519 (Polki)', baseUnit: 'PIECE' },
    { cat: 'Chaliboard & White Wood', wood: 'بياض', name: 'بياض شاليبورد ميتسا دومسينك 4522 (Metsa)', baseUnit: 'PIECE' },
    { cat: 'Chaliboard & White Wood', wood: 'بياض', name: 'بياض شاليبورد 1 جوليا 5*1', baseUnit: 'PIECE' },
    { cat: 'Beams & Strips', wood: 'عروق', name: 'عرق مربع سدائب 3*3 طm', baseUnit: 'PIECE' },
    { cat: 'Beams & Strips', wood: 'عروق', name: 'رابع اونجا 4338 (Ounja)', baseUnit: 'PIECE' },
    { cat: 'Beams & Strips', wood: 'عروق', name: 'رابع 6*38 PT', baseUnit: 'PIECE' },
    { cat: 'Beams & Strips', wood: 'عروق', name: 'رابع 6*38 VIP', baseUnit: 'PIECE' },
    { cat: 'Beams & Strips', wood: 'عروق', name: 'رابع 5*38 VIP', baseUnit: 'PIECE' },
    { cat: 'Beams & Strips', wood: 'عروق', name: 'رابع 12*01 SLP', baseUnit: 'PIECE' },
    { cat: 'Special Timber Grades', wood: 'سويدي', name: 'سودرا 7338 SF (Sodra)', baseUnit: 'PIECE' },
    { cat: 'Special Timber Grades', wood: 'سويدي', name: 'فيدا 6*3 SF', baseUnit: 'PIECE' },
  ];

  for (const item of catalog) {
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categories[item.cat].id,
        woodTypeId: wTypes[item.wood].id,
        name: item.name,
        baseUnit: item.baseUnit,
        variants: {
          create: {
            sku: 'REAL-' + Math.random().toString(36).substring(7).toUpperCase(),
            retailPrice: 250,
            purchasePrice: 150,
            inventory: {
              create: {
                companyId: company.id,
                warehouseId: warehouse.id,
                physicalQty: Math.floor(Math.random() * 500)
              }
            }
          }
        }
      }
    });
    console.log(`Created product: ${product.name}`);
  }

  console.log('Finished inserting real catalog!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
