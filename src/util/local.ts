function get_local_ip(): string {
  let local_ip = '192.168.0.2'; // MAC

  if (process.env.DEV_MACHINE === 'abuja') local_ip = '192.168.0.148';
  if (process.env.DEV_MACHINE === 'ubuntu') local_ip = '192.168.0.155';
  if (process.env.DEV_MACHINE === 'bauchi') local_ip = '192.168.0.151';

  console.log({ local_ip });
  return local_ip;
}

export default get_local_ip;
