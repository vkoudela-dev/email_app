document.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document
    .querySelector('#inbox')
    .addEventListener('click', () => load_mailbox('inbox'));
  document
    .querySelector('#sent')
    .addEventListener('click', () => load_mailbox('sent'));
  document
    .querySelector('#archived')
    .addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#alert_div').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

//  Send email
function send_email() {
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  //  API call to save email content into database
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((msg) => {
      display_msg(msg);
    });
}

//  Display error or successful message after submitting a new email
function display_msg(msg) {
  let alert_div = document.querySelector('#alert_div');
  alert_div.innerHTML = '';
  if (msg.message) {
    load_mailbox('sent');
    alert_div.style.display = 'block';
    alert_div.className = 'alert_green';
    alert_div.innerHTML = msg.message;
  } else {
    alert_div.style.display = 'block';
    alert_div.className = 'alert_red';
    alert_div.innerHTML = msg.error;
  }
}
function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#alert_div').style.display = 'none';

  //  API call for specific list of emails
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Show the mailbox name
      document.querySelector('#emails-view').innerHTML = `<h3>
      ${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}
      </h3>`;
      //  Display all emails
      emails.forEach((email) => {
        const element = document.createElement('a');

        //  Set color of read emails
        if (email.read === true) {
          element.className = 'read';
        }

        //  Display Inbox with sender's email address and Sent box with recipient's email address
        if (email.user === email.sender) {
          element.innerHTML = `<span class="send_from">${email.recipients}</span><span class="subject">${email.subject}</span><span class="timestamp">${email.timestamp}</span>`;
        } else {
          element.innerHTML = `<span class="send_from">${email.sender}</span><span class="subject">${email.subject}</span><span class="timestamp">${email.timestamp}</span>`;
        }
        element.addEventListener('click', () => view_email(email.id));
        document.querySelector('#emails-view').append(element);
      });
    });
}

//  View an email
function view_email(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#alert_div').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  //  API call for a specific email
  fetch(`/emails/${email_id}`)
    .then((response) => response.json())
    .then((email) => {
      const email_view = document.querySelector('#email-view');
      email_view.innerHTML = '';
      //  Create DOM structure of email view
      const div_heading = document.createElement('div');
      div_heading.innerHTML = `<strong>From: </strong> ${email.sender} <br> <strong>To: </strong> ${email.recipients} <br> <strong>Subject: </strong> ${email.subject} <br> <strong>Timestamp: </strong> ${email.timestamp}`;
      const btn_reply = document.createElement('button');
      const btn_archive = document.createElement('button');
      btn_archive.style.display = 'inline-block';
      btn_archive.className = 'btn btn-sm btn-outline-primary';
      btn_reply.style.display = 'inline-block';
      btn_reply.className = 'btn btn-sm btn-outline-primary';
      btn_reply.innerHTML = 'Reply';
      btn_reply.addEventListener('click', () => reply(email));

      //  Check archive status
      if (email.archived === false) {
        btn_archive.innerHTML = 'Archive';
        btn_archive.addEventListener('click', () => archive(email.id));
      } else {
        btn_archive.innerHTML = 'Unarchive';
        btn_archive.addEventListener('click', () => unarchive(email.id));
      }
      const line = document.createElement('hr');
      const text_div = document.createElement('div');
      text_div.innerText = `${email.body}`;

      //  Don't allow to archive sent emails
      if (email.sender !== email.user) {
        email_view.append(div_heading, btn_reply, btn_archive, line, text_div);
      } else {
        email_view.append(div_heading, btn_reply, line, text_div);
      }
      read_status(email.id);
    });
}

//  Change read status to read
function read_status(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    }),
  });
}

//  Archive email
function archive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true,
    }),
  });
  setTimeout(load_mailbox, 1000, 'inbox');
}

//  Unarchive email
function unarchive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false,
    }),
  });
  setTimeout(load_mailbox, 1000, 'inbox');
}

//  Reply to email
function reply(email) {
  compose_email();
  document.querySelector('#compose-recipients').value = `${email.sender}`;
  document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  document.querySelector(
    '#compose-body'
  ).value = `On ${email.timestamp} ${email.recipients} wrote:\n\n${email.body}`;
}
