// android/app/src/main/java/com/flow/expenses/SmsReaderPlugin.java
package com.flow.expenses;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.Telephony;
import android.telephony.SmsMessage;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

// Known Indian bank/UPI sender IDs (partial match)
// Only SMS from these senders will be processed — everything else is ignored
class BankFilter {
    static final String[] BANK_SENDERS = {
        "HDFCBK", "ICICIB", "SBIINB", "AXISBK", "KOTAKB",
        "PNBSMS", "CANBNK", "BOIIND", "UNIONB", "CENTBK",
        "INDBNK", "YESBNK", "IDBIBK", "FEDRAL", "RBLBNK",
        "PAYTMB", "PHONEPE", "GPAY", "AMAZONPAY", "JUSPAY",
        "VM-HDFC", "VM-ICICI", "VM-SBI", "VM-AXIS", "VM-KOTAK",
        "BP-HDFC", "BP-ICICI", "BP-SBI", "LW-HDFCBK", "LW-ICICIB"
    };

    static boolean isBankSender(String address) {
        if (address == null) return false;
        String upper = address.toUpperCase();
        for (String sender : BANK_SENDERS) {
            if (upper.contains(sender)) return true;
        }
        return false;
    }
}

@CapacitorPlugin(
    name = "SmsReaderPlugin",
    permissions = {
        @Permission(strings = {Manifest.permission.READ_SMS}, alias = "readSms"),
        @Permission(strings = {Manifest.permission.RECEIVE_SMS}, alias = "receiveSms"),
    }
)
public class SmsReaderPlugin extends Plugin {

    // Keeps track of active broadcast receivers by callbackId
    private final Map<String, BroadcastReceiver> activeReceivers = new HashMap<>();

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean readGranted = ActivityCompat.checkSelfPermission(
            getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean receiveGranted = ActivityCompat.checkSelfPermission(
            getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;

        JSObject result = new JSObject();
        result.put("granted", readGranted && receiveGranted);
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        requestPermissionForAlias("readSms", call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        boolean readGranted = ActivityCompat.checkSelfPermission(
            getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean receiveGranted = ActivityCompat.checkSelfPermission(
            getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;

        JSObject result = new JSObject();
        result.put("granted", readGranted && receiveGranted);
        call.resolve(result);
    }

    @PluginMethod
    public void readBankSms(PluginCall call) {
        int days = call.getInt("days", 150);
        long sinceMs = System.currentTimeMillis() - (long) days * 24 * 60 * 60 * 1000L;

        JSArray messages = new JSArray();

        try {
            Cursor cursor = getContext().getContentResolver().query(
                Uri.parse("content://sms/inbox"),
                new String[]{"address", "body", "date"},
                "date > ?",
                new String[]{String.valueOf(sinceMs)},
                "date ASC"
            );

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String address = cursor.getString(0);
                    String body = cursor.getString(1);
                    long date = cursor.getLong(2);

                    // Only process bank SMS
                    if (!BankFilter.isBankSender(address)) continue;

                    JSObject msg = new JSObject();
                    msg.put("address", address);
                    msg.put("body", body);
                    msg.put("date", date);
                    messages.put(msg);
                }
                cursor.close();
            }
        } catch (Exception e) {
            call.reject("Failed to read SMS: " + e.getMessage());
            return;
        }

        JSObject result = new JSObject();
        result.put("messages", messages);
        call.resolve(result);
    }

    @PluginMethod(returnType = PluginMethod.RETURN_CALLBACK)
    public void startListening(PluginCall call) {
        call.setKeepAlive(true);
        String callbackId = UUID.randomUUID().toString();

        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
                    SmsMessage[] smsMessages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
                    for (SmsMessage smsMsg : smsMessages) {
                        String address = smsMsg.getDisplayOriginatingAddress();
                        if (!BankFilter.isBankSender(address)) continue;

                        JSObject msg = new JSObject();
                        msg.put("address", address);
                        msg.put("body", smsMsg.getMessageBody());
                        msg.put("date", smsMsg.getTimestampMillis());
                        call.resolve(msg);
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION);
        filter.setPriority(IntentFilter.SYSTEM_HIGH_PRIORITY);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            getContext().registerReceiver(receiver, filter);
        }

        activeReceivers.put(callbackId, receiver);

        JSObject result = new JSObject();
        result.put("callbackId", callbackId);
        call.resolve(result);
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        String callbackId = call.getString("callbackId");
        if (callbackId != null && activeReceivers.containsKey(callbackId)) {
            BroadcastReceiver receiver = activeReceivers.remove(callbackId);
            try {
                getContext().unregisterReceiver(receiver);
            } catch (Exception ignored) {}
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        // Clean up all receivers when app is destroyed
        for (BroadcastReceiver receiver : activeReceivers.values()) {
            try {
                getContext().unregisterReceiver(receiver);
            } catch (Exception ignored) {}
        }
        activeReceivers.clear();
        super.handleOnDestroy();
    }
}
