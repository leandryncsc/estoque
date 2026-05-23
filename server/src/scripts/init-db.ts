import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Script para inicializar banco de dados com migrations e dados padrão
 * Execute com: npx ts-node --project server/tsconfig.json server/src/scripts/init-db.ts
 */

async function initializeDatabase() {
  try {
    console.log('🔄 Iniciando banco de dados...\n');

    // 1. Testar conexão
    console.log('1️⃣  Testando conexão com banco de dados...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexão OK\n');

    // 2. Verificar se tabelas existem
    console.log('2️⃣  Verificando tabelas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(`✅ ${(tables as any[]).length} tabelas encontradas\n`);

    // 3. Verificar se usuário admin existe
    console.log('3️⃣  Verificando usuário admin...');
    let adminUser = await prisma.profiles.findUnique({
      where: { email: 'admin@admin.com' }
    }).catch(() => null);

    if (!adminUser) {
      console.log('   ⚠️  Usuário admin não encontrado, criando...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await prisma.profiles.create({
        data: {
          email: 'admin@admin.com',
          password: hashedPassword,
          name: 'Administrador',
          role: 'administrador',
          user_id: crypto.randomUUID(),
          filial_id: null
        }
      });
      console.log(`✅ Usuário admin criado (senha: admin123)\n`);
    } else {
      console.log('✅ Usuário admin já existe\n');
    }

    // 4. Verificar filiais padrão
    console.log('4️⃣  Verificando filiais...');
    const filiaisCount = await prisma.filiais.count();
    
    if (filiaisCount === 0) {
      console.log('   ⚠️  Nenhuma filial encontrada, criando padrão...');
      await prisma.filiais.create({
        data: {
          nome: 'Filial Principal',
          endereco: 'Rua Principal, 123'
        }
      });
      console.log('✅ Filial padrão criada\n');
    } else {
      console.log(`✅ ${filiaisCount} filial(is) encontrada(s)\n`);
    }

    // 5. Verificar system_settings
    console.log('5️⃣  Verificando configurações do sistema...');
    let settings = await prisma.system_settings.findUnique({
      where: { id: '1' }
    }).catch(() => null);

    if (!settings) {
      console.log('   ⚠️  Configurações não encontradas, criando padrão...');
      settings = await prisma.system_settings.create({
        data: {
          id: '1',
          companyName: 'Supermercado',
          companyEmail: 'admin@supermercado.com',
          companyPhone: '(11) 3000-0000',
          companyAddress: 'Rua Principal, 123',
          lowStockAlert: 10,
          enableNotifications: true,
          enableEmailAlerts: false,
          enableLowStockAlerts: true,
          autoBackup: true,
          darkMode: false,
          compactView: false
        }
      });
      console.log('✅ Configurações padrão criadas\n');
    } else {
      console.log('✅ Configurações já existem\n');
    }

    console.log('═══════════════════════════════════════');
    console.log('✨ BANCO DE DADOS INICIALIZADO COM SUCESSO!');
    console.log('═══════════════════════════════════════\n');
    console.log('📝 DADOS DE TESTE:');
    console.log('   Email: admin@admin.com');
    console.log('   Senha: admin123');
    console.log('   Papel: Administrador\n');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

export default initializeDatabase;
