import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { text } = await req.json()

    if (!text) {
      throw new Error('El texto es requerido')
    }

    // Initialize OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY no está configurada')
    }

    const configuration = new Configuration({
      apiKey: openaiApiKey,
    })
    const openai = new OpenAIApi(configuration)

    // Generate summary using OpenAI
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Por favor, proporciona un resumen conciso del siguiente texto en español:\n\n${text}`,
      max_tokens: 150,
      temperature: 0.3,
    })

    const summary = completion.data.choices[0].text?.trim()

    if (!summary) {
      throw new Error('No se pudo generar el resumen')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Configuración de Supabase incompleta')
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the user from the auth token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('No autorizado')
    }

    // Save the summary to the database
    const { error: dbError } = await supabaseClient
      .from('summaries')
      .insert([
        {
          user_id: user.id,
          original_text: text,
          summary: summary,
        },
      ])

    if (dbError) {
      console.error('Error al guardar el resumen:', dbError)
      // Continue even if saving fails
    }

    return new Response(
      JSON.stringify({ summary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error en la función:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 