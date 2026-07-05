import React, { useEffect, useState } from 'react';
import {
  getBusinessProfile,
  updateBusinessProfile,
} from '../api/client';
import './BusinessProfile.css';

interface Props {
  token: string;
  businessName: string;
  onBack: () => void;
}

interface ServiceItem {
  name: string;
  price: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

export default function BusinessProfile({ token, businessName, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tone, setTone] = useState('profesional, amable y claro');
  const [description, setDescription] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [faq, setFaq] = useState<FaqItem[]>([]);

  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  const [message, setMessage] = useState('');

  const [reminderContact, setReminderContact] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getBusinessProfile(token);

        setTone(profile.tone || 'profesional, amable y claro');
        setDescription(profile.description || '');
        setAddress(profile.address || '');
        setOpeningHours(profile.opening_hours || '');
        setRulesText((profile.rules || []).join('\n'));

     setServices(
            (profile.services || []).map((s: any) => ({
              name: s.name || '',
              price: s.price || '',
              description: s.description || '',
            }))
          );

        setFaq(
          (profile.faq || []).map((f: any) => ({
            question: f.question || '',
            answer: f.answer || '',
          }))
        );

        setBookingEnabled(Boolean(profile.booking_enabled));
        setRemindersEnabled(Boolean(profile.reminders_enabled));
        setWhatsappEnabled(Boolean(profile.whatsapp_enabled));
      } catch {
        setMessage('No se pudo cargar la configuración del negocio.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  const addService = () => {
    setServices([
      ...services,
      { name: '', price: '', description: '' },
    ]);
  };

  const updateService = (
    index: number,
    field: keyof ServiceItem,
    value: string
  ) => {
    const copy = [...services];
    copy[index][field] = value;
    setServices(copy);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const addFaq = () => {
    setFaq([...faq, { question: '', answer: '' }]);
  };

  const updateFaq = (
    index: number,
    field: keyof FaqItem,
    value: string
  ) => {
    const copy = [...faq];
    copy[index][field] = value;
    setFaq(copy);
  };

  const removeFaq = (index: number) => {
    setFaq(faq.filter((_, i) => i !== index));
  };

  const save = async () => {
    setSaving(true);
    setMessage('');

    try {
        const cleanServices = services
          .filter((service) => service.name.trim())
          .map((service) => ({
            name: service.name.trim(),
            price: service.price.trim(),
            description: service.description.trim(),
          }));
          
      const cleanFaq = faq
        .filter((item) => item.question.trim() || item.answer.trim())
        .map((item) => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
        }));

      const rules = rulesText
        .split('\n')
        .map((rule) => rule.trim())
        .filter(Boolean);

      await updateBusinessProfile({
        session_token: token,
        tone,
        description,
        address,
        opening_hours: openingHours,
        services: cleanServices,
        faq: cleanFaq,
        rules,
        booking_enabled: bookingEnabled,
        reminders_enabled: remindersEnabled,
        whatsapp_enabled: whatsappEnabled,
      });

      setMessage('Configuración guardada correctamente.');
    } catch {
      setMessage('No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const sendManualMessage = async () => {
    if (!reminderContact.trim() || !reminderMessage.trim()) {
      setReminderResult('Completa el nombre del contacto y el mensaje.');
      return;
    }

    setSendingReminder(true);
    setReminderResult('');

    try {
      const response = await fetch(
        'http://localhost:5678/webhook/buscar-contacto-wsp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre_buscado: reminderContact.trim(),
            mensaje: reminderMessage.trim(),
          }),
        }
      );

      if (response.ok) {
        setReminderResult('Mensaje enviado correctamente.');
        setReminderContact('');
        setReminderMessage('');
      } else {
        const data = await response.json().catch(() => null);
        setReminderResult(data?.motivo || 'No se pudo enviar el mensaje.');
      }
    } catch {
      setReminderResult('No se pudo conectar con el servidor de mensajes.');
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-screen">
        <div className="profile-card">
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <div className="profile-card">
        <div className="profile-header">
          <div>
            <h1>Configurar negocio</h1>
            <p>{businessName}</p>
          </div>

          <button className="secondary-btn" onClick={onBack}>
            Volver al chat
          </button>
        </div>

        <label>
          Tono del empleado IA
          <input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="Ej: cercano, amable y vendedor"
          />
        </label>

        <label>
          Descripción del negocio
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Barbería moderna especializada en cortes clásicos, degradados y barba."
          />
        </label>

        <label>
          Reglas internas del empleado IA
          <textarea
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            placeholder="No inventar descuentos.&#10;Pedir nombre y celular antes de confirmar una cita.&#10;No agendar fuera del horario de atención."
          />
        </label>

        <label>
          Dirección
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Av. Principal 123, Lima"
          />
        </label>

        <label>
          Horario de atención
          <input
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="Ej: Lunes a sábado de 10:00 a.m. a 8:00 p.m."
          />
        </label>

        <div className="section-block">
          <div className="section-header">
            <div>
              <h2>Servicios</h2>
              <p>Agrega los servicios que el empleado IA podrá ofrecer.</p>
            </div>

            <button className="secondary-btn" onClick={addService}>
              Agregar servicio
            </button>
          </div>

          {services.length === 0 && (
            <p className="empty-text">Aún no hay servicios registrados.</p>
          )}

          {services.map((service, index) => (
            <div className="item-card" key={index}>
              <div className="grid-3">
              <div className="grid-2">
  <label>
    Nombre
    <input
      value={service.name}
      onChange={(e) =>
        updateService(index, 'name', e.target.value)
      }
      placeholder="Ej: Corte clásico, Consulta, Menú ejecutivo, Producto"
    />
  </label>

  <label>
    Precio
    <input
      value={service.price}
      onChange={(e) =>
        updateService(index, 'price', e.target.value)
      }
      placeholder="Ej: 25 soles, Desde 50 soles, A consultar"
    />
  </label>
</div>

<label>
  Descripción breve
  <textarea
    value={service.description}
    onChange={(e) =>
      updateService(index, 'description', e.target.value)
    }
    placeholder="Ej: Incluye lavado, asesoría personalizada o detalles importantes del servicio/producto."
  />
</label>
             
              </div>

              <button
                className="danger-btn"
                onClick={() => removeService(index)}
              >
                Eliminar servicio
              </button>
            </div>
          ))}
        </div>

        <div className="section-block">
          <div className="section-header">
            <div>
              <h2>Preguntas frecuentes</h2>
              <p>Respuestas que el empleado IA usará para atender clientes.</p>
            </div>

            <button className="secondary-btn" onClick={addFaq}>
              Agregar pregunta
            </button>
          </div>

          {faq.length === 0 && (
            <p className="empty-text">Aún no hay preguntas frecuentes.</p>
          )}

          {faq.map((item, index) => (
            <div className="item-card" key={index}>
              <label>
                Pregunta
                <input
                  value={item.question}
                  onChange={(e) =>
                    updateFaq(index, 'question', e.target.value)
                  }
                  placeholder="Ej: ¿Atienden sin cita?"
                />
              </label>

              <label>
                Respuesta
                <textarea
                  value={item.answer}
                  onChange={(e) =>
                    updateFaq(index, 'answer', e.target.value)
                  }
                  placeholder="Ej: Sí, pero recomendamos reservar para asegurar horario."
                />
              </label>

              <button
                className="danger-btn"
                onClick={() => removeFaq(index)}
              >
                Eliminar pregunta
              </button>
            </div>
          ))}
        </div>

        <div className="checks">
          <label className="check-row">
            <input
              type="checkbox"
              checked={bookingEnabled}
              onChange={(e) => setBookingEnabled(e.target.checked)}
            />
            Permitir agendar citas
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(e) => setRemindersEnabled(e.target.checked)}
            />
            Activar recordatorios
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
            />
            Activar WhatsApp
          </label>
        </div>

        {message && <div className="profile-message">{message}</div>}

        <button className="save-btn" onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div>
            <h1>Enviar mensaje directo</h1>
            <p>Busca un contacto por nombre y mándale un WhatsApp al instante.</p>
          </div>
        </div>

        <label>
          Nombre del contacto
          <input
            value={reminderContact}
            onChange={(e) => setReminderContact(e.target.value)}
            placeholder="Ej: Juan Pérez"
          />
        </label>

        <label>
          Mensaje
          <textarea
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
            placeholder="Ej: Hola Juan, te recuerdo tu cita de mañana a las 3pm."
          />
        </label>

        {reminderResult && (
          <div className="profile-message">{reminderResult}</div>
        )}

        <button
          className="save-btn"
          onClick={sendManualMessage}
          disabled={sendingReminder}
        >
          {sendingReminder ? 'Enviando...' : 'Enviar WhatsApp'}
        </button>
      </div>
    </div>
  );
}