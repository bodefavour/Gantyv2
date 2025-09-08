import { supabase } from './src/lib/supabase.js';
import fs from 'fs';

async function fixRLSPolicies() {
    try {
        console.log('Reading SQL fix script...');
        const sqlScript = fs.readFileSync('./fix_rls_policies.sql', 'utf8');
        
        console.log('Applying RLS policy fixes...');
        
        // Split the script into individual statements
        const statements = sqlScript
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`Executing: ${statement.substring(0, 60)}...`);
                const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
                
                if (error) {
                    console.error('Error executing statement:', error);
                    // Continue with other statements
                } else {
                    console.log('✓ Statement executed successfully');
                }
            }
        }

        console.log('RLS policy fixes completed!');
    } catch (error) {
        console.error('Error applying RLS fixes:', error);
    }
}

fixRLSPolicies();
